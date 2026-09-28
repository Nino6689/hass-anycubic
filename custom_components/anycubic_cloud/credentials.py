"""Anycubic's app credentials, loaded at run time (docs/CLOUD.md §1).

The cloud only answers requests signed with Anycubic's own app credentials,
and its MQTT broker wants Anycubic's TLS material. None of it is in this
repository or in ``anycubic-cloud-client``: it is read, by name only, from the
``anycubic-cloud-api`` package every 2.x install already has.

The items are loaded once per Home Assistant run, in the executor (importing
and reading files block), and kept only in memory. They are never logged and
never put in diagnostics or the token store. When anything is missing the
cloud is unavailable, a repair issue says so and LAN keeps working.
"""

from __future__ import annotations

import importlib
from importlib import resources
import logging
from typing import Final

from anycubic_cloud_client import CloudSecrets, SecretsInvalidError
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.util.hass_dict import HassKey

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

ISSUE_CREDENTIALS: Final = "cloud_credentials_unavailable"

# Where each CloudSecrets field comes from (CLOUD.md §1), by name only.
_PACKAGE: Final = "anycubic_cloud_api"
_CONST_MODULE: Final = "anycubic_cloud_api.const.const"
_ATTRIBUTES: Final = {
    "app_id": "AC_KNOWN_AID",
    "app_secret": "AC_KNOWN_SEC",
    "client_id_web": "AC_KNOWN_CID_WEB",
    "client_id_app": "AC_KNOWN_CID_APP",
}
# Note the package's own spelling "mqqt".
_FILES: Final = {
    "mqtt_ca_pem": "resources/anycubic_mqqt_tls_ca.crt",
    "mqtt_client_cert_pem": "resources/anycubic_mqqt_tls_client.crt",
    "mqtt_client_key_pem": "resources/anycubic_mqqt_tls_client.key",
}

DATA_SECRETS: HassKey[CloudSecrets | None] = HassKey(f"{DOMAIN}_cloud_secrets")


class CredentialsUnavailableError(Exception):
    """An item is missing, or ``CloudSecrets`` rejected what was found."""


def load_cloud_secrets() -> CloudSecrets:
    """Build ``CloudSecrets`` from the installed package. Blocking.

    The error message names the missing item, never a value.
    """
    try:
        module = importlib.import_module(_CONST_MODULE)
    except ImportError as err:
        raise CredentialsUnavailableError(f"{_CONST_MODULE} is not installed") from err
    texts: dict[str, str] = {}
    for field, attribute in _ATTRIBUTES.items():
        value = getattr(module, attribute, None)
        if not isinstance(value, str):
            raise CredentialsUnavailableError(f"{attribute} is missing")
        texts[field] = value
    pems: dict[str, bytes] = {}
    for field, path in _FILES.items():
        try:
            pems[field] = resources.files(_PACKAGE).joinpath(path).read_bytes()
        except (OSError, ImportError, ValueError) as err:
            raise CredentialsUnavailableError(f"{path} is missing") from err
    try:
        return CloudSecrets(
            app_id=texts["app_id"],
            app_secret=texts["app_secret"],
            client_id_web=texts["client_id_web"],
            client_id_app=texts["client_id_app"],
            mqtt_ca_pem=pems["mqtt_ca_pem"],
            mqtt_client_cert_pem=pems["mqtt_client_cert_pem"],
            mqtt_client_key_pem=pems["mqtt_client_key_pem"],
        )
    except SecretsInvalidError as err:
        # The library's message names the field only.
        raise CredentialsUnavailableError(str(err)) from err


async def async_get_cloud_secrets(hass: HomeAssistant) -> CloudSecrets | None:
    """The credentials, loaded once per run; ``None`` when unavailable.

    On failure a repair issue is raised and one warning logged; on success a
    leftover issue is removed. Nothing about any entry is changed.
    """
    if DATA_SECRETS in hass.data:
        return hass.data[DATA_SECRETS]
    try:
        secrets = await hass.async_add_executor_job(load_cloud_secrets)
    except CredentialsUnavailableError as err:
        _LOGGER.warning(
            "Anycubic cloud features are unavailable: the app credentials could "
            "not be loaded from the %s package (%s)",
            _PACKAGE,
            err,
        )
        hass.data[DATA_SECRETS] = None
        _async_raise_issue(hass)
        return None
    hass.data[DATA_SECRETS] = secrets
    ir.async_delete_issue(hass, DOMAIN, ISSUE_CREDENTIALS)
    return secrets


@callback
def _async_raise_issue(hass: HomeAssistant) -> None:
    ir.async_create_issue(
        hass,
        DOMAIN,
        ISSUE_CREDENTIALS,
        is_fixable=False,
        is_persistent=False,
        severity=ir.IssueSeverity.ERROR,
        translation_key=ISSUE_CREDENTIALS,
        translation_placeholders={"package": "anycubic-cloud-api"},
    )
