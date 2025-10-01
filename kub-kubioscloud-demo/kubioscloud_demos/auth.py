"""KubiosCloud authentication helpers"""
import logging
import os
import uuid
from typing import Dict
from urllib.parse import parse_qs, urlparse

import requests

from .kubcloud import USER_AGENT, request_dump

deployment = os.environ.get("KUB_ENV", "prd")
if deployment == "prd":
    LOGIN_URL = "https://kubioscloud.auth.eu-west-1.amazoncognito.com/login"
    TOKEN_URL = "https://kubioscloud.auth.eu-west-1.amazoncognito.com/oauth2/token"
    REDIRECT_URI = "https://analysis.kubioscloud.com/v1/portal/login"
elif deployment == "stg":
    LOGIN_URL = "https://kubioscloud-stg.auth.eu-west-1.amazoncognito.com/login"
    TOKEN_URL = "https://kubioscloud-stg.auth.eu-west-1.amazoncognito.com/oauth2/token"
    REDIRECT_URI = "https://analysis.stg.kubioscloud.com/v1/portal/login"
else:
    raise ValueError("Unsupported Kubios Environment")


class AuthenticationError(BaseException):
    """Authentication Error"""


def user_login(
    username: str, password: str, client_id: str, redirect_uri: str = REDIRECT_URI
) -> Dict[str, str]:
    """Get authentication tokens using username & password.

    :param: username: KubiosCloud username
    :param: password: Password

    :return: dict with authentication and refresh tokens
    """
    log = logging.getLogger(__name__)
    csrf = str(uuid.uuid4())

    # Authentication
    session = requests.session()
    session.hooks["response"].append(request_dump)
    log.info("Authenticating to %r with client_id: %r", LOGIN_URL, client_id)
    login_data = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "username": username,
        "password": password,
        "response_type": "token",
        "scope": "openid",
        "_csrf": csrf,
    }
    login_response = session.post(
        LOGIN_URL,
        data=login_data,
        allow_redirects=False,
        headers={"Cookie": f"XSRF-TOKEN={csrf}", "User-Agent": USER_AGENT},
    )
    # Verify results
    login_response.raise_for_status()
    location_url = login_response.headers["Location"]
    if location_url == LOGIN_URL:
        raise AuthenticationError(
            f"Status: {login_response.status_code}, Authentication failed."
        )
    parsed = urlparse(location_url)
    parameters = parse_qs(parsed.fragment)
    tokens = {
        "id_token": parameters["id_token"][0],
        "access_token": parameters["access_token"][0],
    }

    return tokens
