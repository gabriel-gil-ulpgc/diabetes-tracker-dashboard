"""Simple CLI client for KubiosCloud."""
import json
import logging
from enum import Enum
from pathlib import Path
from typing import List, Optional, cast
from uuid import UUID

import typer
import yaml
from rich.console import Console

from . import auth, kubcloud

app = typer.Typer()
console = Console()


class MeasurementState(str, Enum):
    """Measurement state enum"""

    active = "active"
    finalized = "finalized"


@app.command(
    help="Login with user credentials. Store login data to tokens file (if specifid)."
)
def login(
    username: str = typer.Argument(None, envvar="KUB_USERNAME"),
    password: str = typer.Option(
        None, prompt=True, hide_input=True, envvar="KUB_PASSWORD"
    ),
    client_id: str = typer.Argument(None, envvar="KUB_CLIENT_ID"),
    tokens_file: Optional[Path] = typer.Option(
        None,
        file_okay=True,
        dir_okay=False,
        writable=True,
        readable=True,
        resolve_path=True,
        help="Authentication token storage file",
    ),
):
    """Login action."""
    try:
        tokens = auth.user_login(username, password, client_id=client_id)
    except auth.AuthenticationError as ex:
        console.log(f"[red]{ex}")
        return
    if tokens_file:
        console.log(f"Writing tokens to {tokens_file}")
        with tokens_file.open("w") as file_handlde:
            yaml.dump(tokens, file_handlde)
    console.log(json.dumps(tokens))


@app.command(help="Get user information")
def user(id_token: Optional[str] = typer.Argument(None, envvar="KUB_ID_TOKEN")):
    """"Get user information"""
    if not id_token:
        raise typer.BadParameter("Valid id_token is required.")
    user_info = kubcloud.user_info(id_token)
    console.log(user_info)


@app.command(help="List user's measurements")
def measurements_list(
    id_token: Optional[str] = typer.Argument(None, envvar="KUB_ID_TOKEN"),
    state: Optional[MeasurementState] = None,
):
    """List user's measurements"""
    if not id_token:
        raise typer.BadParameter("Valid id_token is required.")
    measurement_list = kubcloud.measurement_list(id_token, state=state)
    console.log(measurement_list)


@app.command(help="Get measurement details")
def measurement_info(
    measurement_id: UUID,
    id_token: Optional[str] = typer.Argument(None, envvar="KUB_ID_TOKEN"),
):
    """Get measurement details, measurement_info endpoint"""
    if not id_token:
        raise typer.BadParameter("Valid id_token is required.")
    measure_info = kubcloud.measurement_info(id_token, measurement_id=measurement_id)
    console.log(measure_info)


@app.command(help="Download measurement data")
def measurement_download(
    measurement_id: UUID,
    output: Optional[Path] = typer.Option(
        None,
        exists=False,
        file_okay=True,
        dir_okay=False,
        writable=True,
        readable=True,
        resolve_path=True,
        help="Output file",
    ),
    id_token: Optional[str] = typer.Argument(None, envvar="KUB_ID_TOKEN"),
):
    """Download and decode measurement data"""
    if not id_token:
        raise typer.BadParameter("Valid id_token is required.")
    measure_info = kubcloud.measurement_info(id_token, measurement_id=measurement_id)
    data = {}
    for channel in measure_info["measure"].get("channels", []):
        data[channel["type"]] = kubcloud.get_channel_data(
            channel["data_url"], channel["data_enc"]
        )
    if output:
        with output.open("w") as file_handle:
            json.dump(data, file_handle)
    else:
        console.log(data)


def channel_validation(channel_data: List[str]) -> List[kubcloud.ChannelSpec]:
    """Validate channel specification"""
    ch_specs = []
    for idx, ch_input in enumerate(channel_data):
        try:
            ch_data = json.loads(ch_input)
        except ValueError as ex:
            raise typer.BadParameter(f"Malformatted json: '{ch_input}'") from ex
        ch_data.setdefault("index", idx)
        try:
            ch_spec = kubcloud.ChannelSpec.from_spec(ch_data)
        except TypeError as ex:
            raise typer.BadParameter(f"Invalid channel specification: {ch_input}\n{ex}")
        ch_specs.append(ch_spec)
    return ch_specs


@app.command(help="Initialize new measurement")
def measurement_init(
    id_token: str,
    user_id: str = "self",
    description: Optional[str] = "",
    channel: List[str] = typer.Option(
        "",
        help="Channel specification json. Specify multiple channels by repeating argument.",
        callback=channel_validation,
    ),
):
    """Initialize new measurement session."""
    # Manual cast as MyPy doesn't recognize type change with typer option callback
    channels = cast(List[kubcloud.ChannelSpec], channel)
    response = kubcloud.measurement_init(
        id_token, user_id=user_id, description=description, channels=channels
    )
    console.log(response)


@app.command(help="Add data chunk to measurement")
def measurement_data(
    id_token: str,
    measurement_id: Optional[UUID] = None,
    data: str = "",
    data_file: Optional[Path] = typer.Option(
        None,
        exists=True,
        file_okay=True,
        dir_okay=False,
        writable=False,
        readable=True,
        resolve_path=True,
        help="Data file",
    ),
    chunk_seq: int = 0,
    channel_index: int = 0,
    user_id: str = "self",
):  # pylint: disable=too-many-arguments
    """Add data to measurement session."""
    if not (data or data_file):
        console.log("No data given.")
        return
    values = []
    if data:
        values = json.loads(data)
    if data_file:
        with data_file.open("r") as file_handle:
            values = [float(line) for line in file_handle]
            if max(values) < 500:
                # Convert to ms
                values = [int(x * 1000) for x in values]
    if not measurement_id:
        console.log("No measurement_id given.")
        return
    response = kubcloud.measurement_chunk(
        id_token,
        user_id=user_id,
        measure_id=measurement_id,
        channel_index=channel_index,
        chunk_seq=chunk_seq,
        data=values,
    )  # pylint: disable=no-value-for-parameter  # Decorator creates session
    console.log(response)


@app.command(help="Finalize measurement")
def measurement_final(
    id_token: str,
    measurement_id: Optional[UUID] = None,
    user_id: str = "self",
):
    """Finalize measurement session and call analysis."""
    response = kubcloud.measurement_final(
        id_token, measure_id=measurement_id, user_id=user_id
    )
    console.log(response)


@app.command(help="List user's results")
def results_list(
    id_token: Optional[str] = typer.Argument(None, envvar="KUB_ID_TOKEN"),
):
    """List previous results for given user."""
    if not id_token:
        raise typer.BadParameter("Valid id_token is required.")
    results = kubcloud.results_list(
        id_token
    )  # pylint: disable=no-value-for-parameter  # Decorator creates session
    console.log(results)


@app.callback(name="demo")
def main(
    ctx: typer.Context,
    config: Optional[Path] = typer.Option(
        None,
        exists=True,
        file_okay=True,
        dir_okay=False,
        writable=False,
        readable=True,
        resolve_path=True,
        help="Configuration file",
    ),
    tokens_file: Optional[Path] = typer.Option(
        None,
        exists=False,
        file_okay=True,
        dir_okay=False,
        writable=True,
        readable=True,
        resolve_path=True,
        help="Authentication token storage file",
    ),
    debug: bool = typer.Option(
        False, envvar="KUB_DEBUG", help="Verbose printing of requests made."
    ),
):
    """Common options"""
    subcommand = ctx.invoked_subcommand or ""
    if not subcommand:
        return
    for filepath in (config, tokens_file):
        if filepath is None or not filepath.exists():
            continue
        data = yaml.safe_load(filepath.open("r"))
        if ctx.default_map is None:
            ctx.default_map = {subcommand: {}}
        for param, value in data.items():
            ctx.default_map[subcommand].setdefault(param, value)
    if (
        subcommand == "login"
        and tokens_file is not None
        and ctx.default_map is not None
    ):
        ctx.default_map[subcommand].setdefault("tokens_file", tokens_file)
    if debug:
        logging.getLogger("kub_request").setLevel(logging.DEBUG)
