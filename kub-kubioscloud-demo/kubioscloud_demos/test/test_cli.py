"""Unit tests for CLI functions"""
from unittest import mock

from typer.testing import CliRunner

from ..cli import app

runner = CliRunner()


@mock.patch("kubioscloud_demos.cli.auth")
def test_login_call(mock_user_auth):
    """Test login function call"""
    mock_user_auth.user_login = mock.Mock(return_value={"id_token": "deadbeaf"})
    mock_user_auth.AuthenticationError = BaseException

    result = runner.invoke(app, ["--config", "sample_config.yaml", "login"])

    mock_user_auth.user_login.assert_called_with(
        "<kubios_username>", "<password_for_the_user>", client_id="<client_id>"
    )
    assert result.exit_code == 0
    assert "id_token" in result.stdout


@mock.patch("kubioscloud_demos.cli.kubcloud")
def test_measurement_init(mock_kubcloud):
    """Test measurement initialization"""
    mock_kubcloud.measurement_init = mock.Mock(return_value="Ok")
    result = runner.invoke(
        app,
        [
            "measurement-init",
            "<id_token>",
            "--channel",
            '{"data_enc":[["value", "H"]], "label":"RR"}',
            "--channel",
            '{"data_enc":[["value", "H"]], "label":"RR2"}',
        ],
    )
    mock_kubcloud.measurement_init.assert_called_once_with(
        "<id_token>", user_id="self", description="", channels=[mock.ANY, mock.ANY]
    )
    assert result.exit_code == 0
