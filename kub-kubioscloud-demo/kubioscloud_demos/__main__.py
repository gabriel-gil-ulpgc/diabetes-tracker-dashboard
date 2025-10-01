"""Module main"""
import logging

from click import exceptions
from requests.models import HTTPError
from rich.logging import RichHandler

from . import cli

if __name__ == "__main__":
    FORMAT = "%(message)s"
    logging.basicConfig(
        level=logging.INFO, format=FORMAT, datefmt="[%X]", handlers=[RichHandler()]
    )
    try:
        cli.app()
    except (exceptions.Exit, SystemExit):
        pass
    except (FileNotFoundError, HTTPError) as ex:
        cli.console.log(f"[red]{ex}")
    except BaseException:  # pylint: disable=broad-except  ## We want to catch them all here
        cli.console.print_exception()
