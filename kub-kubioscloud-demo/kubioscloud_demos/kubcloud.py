"""KubiosCloud query functions"""
import logging
import os
import struct
import textwrap
from dataclasses import asdict, dataclass
from enum import Enum
from functools import wraps
from typing import Dict, List, Optional, Union
from uuid import UUID

import jsons  # type: ignore
import msgpack  # type: ignore
import requests

deployment = os.environ.get("KUB_ENV", "prd")
if deployment == "prd":
    KUBIOSCLOUD_BASE_URL = "https://analysis.kubioscloud.com/"
elif deployment == "stg":
    KUBIOSCLOUD_BASE_URL = "https://analysis.stg.kubioscloud.com/"
else:
    raise ValueError("Unsupported Kubios environment")
USER_AGENT = "DemoApp 1.0"  # FIXME: Use unique name for your application  # pylint: disable=fixme


def request_dump(resp: requests.Response, *_args, **_kwargs):
    """Dump request and response data to debug log."""
    log = logging.getLogger("kub_request")
    req = resp.request
    log_msg = textwrap.dedent(
        f"""
        [bold]---------------- Request ----------------[/]
        {req.method} {req.url}
        {req.headers}

        {req.body!r}
        [bold]---------------- Response ----------------[/]
        {resp.status_code} {resp.reason} {resp.url}
        {resp.headers}

        {resp.text}
    """
    )
    log.debug(log_msg, extra={"markup": True})


class ChannelType(str, Enum):
    """Supported channel types enum"""

    Acc = "Acc"
    Markers = "Markers"
    RRI = "RRI"
    PPI = "PPI"
    PPG = "PPG"
    ECG = "ECG"
    Load = "Load"
    Force = "Force"
    RPM = "RPM"


@dataclass
class ChannelSpec:
    """Measurement data channel specification"""

    index: int
    type: ChannelType
    data_enc: list
    label: Optional[str] = None
    description: Optional[str] = None

    @staticmethod
    def from_spec(ch_spec: dict):
        """Create ChannelSpec from given dict, uses RRI is the default channel type."""
        ch_spec["type"] = ChannelType(ch_spec.get("type", "RRI"))
        return ChannelSpec(**ch_spec)

    @staticmethod
    def serializer(obj, **_kwargs):
        """Serialize the object."""
        dct = asdict(obj)
        return {k: v for k, v in dct.items() if v is not None}


def _decode_data(data_enc, data):
    """Decode channel data"""
    if data_enc == "list":
        decoded = msgpack.unpackb(data, raw=False)

    else:
        data_struct = "".join([e[1] for e in data_enc])
        label_indices = [e[0] for e in data_enc]
        data_struct_size = struct.calcsize(data_struct)

        decoded = []
        for i in range(0, len(data) - 1, data_struct_size):
            values = struct.unpack_from(data_struct, data, i)
            if not isinstance(values, (tuple, list)):
                values = (values,)
            decoded.append(dict(zip(label_indices, values)))

    return decoded


def with_request_session(func):
    """Decorator to initialize request session before function call."""

    @wraps(func)
    def with_session(id_token: str, **kwargs):
        session = requests.session()
        session.hooks["response"].append(request_dump)
        session.headers.update(
            {
                "Content-Type": "application/json",
                "Authorization": id_token,
                "User-Agent": USER_AGENT,
            }
        )
        return func(session, **kwargs)

    return with_session


@with_request_session
def user_info(session: requests.Session, user_id: Union[UUID, str] = "self") -> dict:
    """Get user details"""
    response = session.get(KUBIOSCLOUD_BASE_URL + f"v1/user/{user_id}")
    response.raise_for_status()
    return response.json()


@with_request_session
def measurement_list(
    session: requests.Session, user_id: str = "self", state: Optional[str] = None
) -> dict:
    """Get user measurements"""
    params = {}
    if state is not None:
        params["state"] = state
    response = session.get(
        KUBIOSCLOUD_BASE_URL + f"v2/measure/{user_id}/session", data=params
    )
    response.raise_for_status()
    return response.json()


@with_request_session
def measurement_info(
    session: requests.Session, measurement_id: UUID, user_id: str = "self"
) -> dict:
    """Get user measurements"""
    response = session.get(
        f"{KUBIOSCLOUD_BASE_URL}v2/measure/{user_id}/session/{measurement_id}",
    )
    response.raise_for_status()
    return response.json()


@with_request_session
def measurement_init(
    session: requests.Session,
    channels: List[ChannelSpec],
    user_id: Optional[Union[UUID, str]] = "self",
    description: Optional[str] = None,
) -> dict:
    """Initialize measurement"""
    jsons.set_serializer(ChannelSpec.serializer, ChannelSpec)
    data: Dict[str, Union[str, List[ChannelSpec]]] = {"channels": channels}
    if description:
        data.update({"description": description})
    response = session.post(
        f"{KUBIOSCLOUD_BASE_URL}v2/measure/{user_id}/session",
        data=jsons.dumps(data),
    )
    response.raise_for_status()
    return response.json()


@with_request_session
def measurement_chunk(  # pylint: disable=too-many-arguments
    session: requests.Session,
    measure_id: UUID,
    channel_index: int,
    chunk_seq: int,
    data: str,
    user_id: Optional[Union[UUID, str]] = "self",
) -> dict:
    """Add mesurement chunk"""
    channel_data = {"index": channel_index, "chunk_seq": chunk_seq, "data": data}
    msg = jsons.dumps({"channels": [channel_data]})
    response = session.post(
        f"{KUBIOSCLOUD_BASE_URL}v2/measure/{user_id}/session/{measure_id}/chunk",
        data=msg,
    )
    response.raise_for_status()
    return response.json()


@with_request_session
def measurement_final(
    session: requests.Session,
    measure_id: UUID,
    user_id: Optional[Union[UUID, str]] = "self",
    request_analysis: bool = True,
) -> dict:
    """Finalize measurement."""
    data = None
    if request_analysis:
        data = {"analysis": [{"type": "readiness", "channel_index": 0}]}

    response = session.post(
        f"{KUBIOSCLOUD_BASE_URL}v2/measure/{user_id}/session/{measure_id}/finalize",
        data=jsons.dumps(data),
    )
    response.raise_for_status()
    return response.json()


def get_channel_data(s3_url: str, data_enc: Optional[list] = None):
    """Fetch and decode data from S3 url."""
    data = requests.get(s3_url).content
    return _decode_data(data_enc, data)


@with_request_session
def results_list(session: requests.Session, user_id: str = "self") -> dict:
    """Get user results"""
    response = session.get(KUBIOSCLOUD_BASE_URL + f"v1/result/{user_id}")
    response.raise_for_status()
    return response.json()
