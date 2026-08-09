"""Adds config flow for Anycubic Cloud integration."""
from __future__ import annotations

import hashlib
import time
import traceback
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any

import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from aiohttp import CookieJar
from anycubic_cloud_api.anycubic_api import AnycubicMQTTAPI as AnycubicAPI
from anycubic_cloud_api.const.regions import AnycubicRegion, resolve_region
from anycubic_cloud_api.exceptions.exceptions import (
    AnycubicLANCloudModeError,
    AnycubicLANError,
    AnycubicLANUnsupportedError,
)
from anycubic_cloud_api.lan import AnycubicLANHandshake
from anycubic_cloud_api.models.auth import AnycubicAuthMode
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import (
    async_create_clientsession,
    async_get_clientsession,
)
from homeassistant.helpers.device_registry import format_mac
from homeassistant.helpers.selector import (
    BooleanSelector,
    ObjectSelector,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)
from homeassistant.helpers.service_info.dhcp import DhcpServiceInfo
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    CONF_CARD_CONFIG,
    CONF_DEBUG_API_CALLS,
    CONF_DEBUG_DEPRECATED,
    CONF_DEBUG_MQTT_MSG,
    CONF_DRYING_PRESET_DURATION_,
    CONF_DRYING_PRESET_TEMPERATURE_,
    CONF_LAN_HOST,
    CONF_LAN_MODE_ENABLED,
    CONF_MQTT_CONNECT_MODE,
    CONF_PRINTER_ID_LIST,
    CONF_REGION,
    CONF_USER_AUTH_MODE,
    CONF_USER_DEVICE_ID,
    CONF_USER_TOKEN,
    DOMAIN,
    LOGGER,
    MAX_DRYING_PRESETS,
    STORAGE_KEY,
    STORAGE_VERSION,
    TOOLS_URL,
)
from .helpers import (
    TOKEN_TYPE_EXPECTED,
    AnycubicMQTTConnectMode,
    async_load_saved_tokens,
    async_repair_access_token,
    describe_token,
    detect_auth_mode,
    extract_panel_card_config,
    extract_pasted_token,
    remove_quotes_from_string,
    token_expiry_timestamp,
    token_type_looks_wrong,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

AUTH_MODES = {
    AnycubicAuthMode.WEB: "Web (No MQTT)",
    AnycubicAuthMode.SLICER: "Slicer",
    AnycubicAuthMode.ANDROID: "Android",
}

DATA_SCHEMA_AUTH_WEB = vol.Schema(
    {
        vol.Required(CONF_USER_TOKEN): cv.string,
    }
)

DATA_SCHEMA_AUTH_SLICER = vol.Schema(
    {
        vol.Required(CONF_USER_TOKEN): cv.string,
    }
)


def _region_selector() -> SelectSelector:
    """Which Anycubic deployment the account belongs to.

    A dropdown on the token form rather than a step of its own: it has to be
    answered before the token is sent anywhere, but it is a one-click default
    for almost everybody, and an extra full-screen question would tax every
    international user to serve a handful of Chinese ones.

    Deliberately not auto-detected. Anycubic's China service is a separate
    deployment with separate accounts, and the only claim that might identify
    it -- the token's issuer -- was observed carrying the *international*
    value on the China token in issue #13. Probing the other cloud to find
    out would mean sending someone's bearer token to a second operator in
    another jurisdiction on every failed login, which is not a reasonable
    thing to do by default.
    """
    return SelectSelector(
        SelectSelectorConfig(
            options=[
                SelectOptionDict(
                    value=AnycubicRegion.INTERNATIONAL.value,
                    label="International — anycubic.com",
                ),
                SelectOptionDict(
                    value=AnycubicRegion.CHINA.value,
                    label="China / 中国 — anycubicloud.com",
                ),
            ],
            mode=SelectSelectorMode.DROPDOWN,
            # No translation_key deliberately: the labels carry the operators'
            # own domain names, and the whole point of showing them is that a
            # user can match one against the address they actually sign in at.
            # Translating a hostname would defeat that. Note that passing None
            # is not the same as omitting it -- the selector schema rejects a
            # null outright.
        )
    )


DATA_SCHEMA_TOKEN = vol.Schema(
    {
        vol.Required(CONF_USER_TOKEN): cv.string,
        # Only the Android flow needs this; left blank for Web and Slicer.
        vol.Optional(CONF_USER_DEVICE_ID): cv.string,
        vol.Optional(
            CONF_REGION,
            default=AnycubicRegion.INTERNATIONAL.value,
        ): _region_selector(),
    }
)

DATA_SCHEMA_AUTH_ANDROID = vol.Schema(
    {
        vol.Required(CONF_USER_TOKEN): cv.string,
        vol.Required(CONF_USER_DEVICE_ID): cv.string,
    }
)

MQTT_CONNECT_MODES = {
    AnycubicMQTTConnectMode.Printing_Only: "Printing Only",
    AnycubicMQTTConnectMode.Printing_Drying: "Printing & Drying",
    AnycubicMQTTConnectMode.Device_Online: "Device Online",
    AnycubicMQTTConnectMode.Always: "Always",
    AnycubicMQTTConnectMode.Never_Connect: "Never Connect",
}


def region_from_entry_data(data: Mapping[str, Any]) -> AnycubicRegion:
    """The region an entry belongs to, for entries that may not name one.

    Every read of the stored value goes through here. Reading it directly is
    the one mistake in this change with a catastrophic failure mode: entries
    created before this field existed, and every LAN-only entry, simply have
    no region -- and `data.get(CONF_REGION) == AnycubicRegion.INTERNATIONAL`
    is False for those, so a direct comparison would treat every existing
    install as the non-default case and turn ordinary reauth into an
    unrecoverable failure.
    """
    return resolve_region(data.get(CONF_REGION))


def async_create_anycubic_api(
    hass: HomeAssistant,
    auth_token: str | None,
    auth_mode: AnycubicAuthMode | int | None = None,
    device_id: str | None = None,
    region: AnycubicRegion | str | None = None,
) -> AnycubicAPI:
    if not auth_token:
        raise Exception("Missing auth token.")

    resolved = resolve_region(region)

    cookie_jar = CookieJar(unsafe=True)
    websession = async_create_clientsession(
        hass,
        cookie_jar=cookie_jar,
    )
    api = AnycubicAPI(
        session=websession,
        cookie_jar=cookie_jar,
        debug_logger=LOGGER,
        region=resolved,
    )

    api.set_authentication(
        auth_token=auth_token,
        auth_mode=auth_mode,
        device_id=device_id,
        # Slicer mode normally reclassifies a pasted token as an access token.
        # China's slicer issues an HS512 user token instead, and only a token
        # left in _auth_token can be used to log in to MQTT -- reclassify it
        # and MQTT is quietly unavailable while setup still reports success.
        # Note the polarity: every other region, and every unrecognised
        # value, keeps today's True.
        auto_pick_token=resolved is not AnycubicRegion.CHINA,
    )

    return api


async def async_load_tokens_from_store(
    hass: HomeAssistant,
    anycubic_api: AnycubicAPI,
    entry_id: str | None = None,
) -> None:
    """Load saved tokens for an entry, or the legacy shared ones during setup.

    A first-time setup has no entry yet, so it can only fall back to the legacy
    store; a reconfigure passes its entry_id and gets that entry's own tokens.
    """
    if entry_id is not None:
        await async_load_saved_tokens(hass, entry_id, anycubic_api)
        return

    config = await Store[dict[str, Any]](hass, STORAGE_VERSION, STORAGE_KEY).async_load()

    if config:
        anycubic_api.load_auth_config_from_dict(config, minimal=True)


def lan_printer_id(device_id: str) -> int:
    """A stable integer handle for a printer known only over the network.

    Printers do not agree on what a device id looks like: a Kobra S1 reports
    digits, a Kobra 3 V2 reports a 32-character hex string. Everything
    downstream -- the coordinator's printer map, the entity base class, the
    service schemas -- treats a printer id as an integer, so the id is mapped
    to one here, at the only boundary where a local printer gets an identity.

    Digits are kept as they are, so a printer whose local id already matches
    its cloud id keeps that id and its history if an account is added later.
    Anything else is digested. 48 bits stays well inside the range Home
    Assistant can store -- its JSON encoder rejects anything wider than 64
    bits outright, and silently loses the whole write when it does -- while
    sitting far above the range real cloud ids occupy, so a digested id
    cannot collide with a real one.
    """
    if device_id.isdigit() and len(device_id) <= 15:
        return int(device_id)

    digest = hashlib.blake2b(device_id.encode(), digest_size=6).digest()
    return int.from_bytes(digest, "big")


async def check_lan_host(hass: HomeAssistant, host: str) -> dict[str, str]:
    """Prove the printer is reachable and in LAN Mode before saving."""
    errors, _broker = await async_lan_handshake(hass, host)

    return errors


async def async_lan_handshake(
    hass: HomeAssistant, host: str
) -> tuple[dict[str, str], Any]:
    """Handshake with the printer, returning any error and what it said.

    The broker carries the printer's own device id, which a local-only entry
    needs -- there is no cloud account to enumerate printers from.
    """
    handshake = AnycubicLANHandshake(async_create_clientsession(hass), host, LOGGER)

    try:
        broker = await handshake.async_authenticate()
    except AnycubicLANCloudModeError:
        return {"base": "lan_printer_in_cloud_mode"}, None
    except AnycubicLANUnsupportedError:
        return {"base": "lan_unsupported_printer"}, None
    except AnycubicLANError:
        return {"base": "lan_unreachable"}, None
    except Exception:
        LOGGER.debug(f"Unexpected error checking LAN Mode:\n{traceback.format_exc()}")
        return {"base": "lan_unreachable"}, None

    return {}, broker


class AnycubicCloudConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for AnycubicCloud integration."""

    VERSION = 1

    entry: ConfigEntry | None

    def __init__(self) -> None:
        """Initialize."""
        self._user_token: str | None = None
        self._user_auth_mode: AnycubicAuthMode | int | None = None
        self._user_device_id: str | None = None
        self._user_region: AnycubicRegion = AnycubicRegion.INTERNATIONAL
        self._is_reconfigure: bool = False
        self._is_reauth: bool = False
        self._anycubic_api: AnycubicAPI | None = None
        self.entry: ConfigEntry | None = None
        self._discovered_host: str | None = None

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> AnycubicCloudOptionsFlowHandler:
        """Get the options flow for this handler."""
        return AnycubicCloudOptionsFlowHandler(config_entry)

    def _async_create_anycubic_api(self) -> AnycubicAPI:
        return async_create_anycubic_api(
            self.hass,
            self._user_token,
            self._user_auth_mode,
            self._user_device_id,
            self._user_region,
        )

    def _errors_unknown_authentication_failure(
        self,
        error: Exception,
    ) -> dict[str, str]:
        LOGGER.error("Authentication failed with unknown Error. Check credentials %s", error)
        return {"base": "cannot_connect"}

    async def _async_check_anycubic_api_instance_exists(self) -> None:
        if self._anycubic_api is not None:
            return

        LOGGER.debug("Setting up API instance for config flow.")

        self._anycubic_api = self._async_create_anycubic_api()

        if not self.entry or self._is_reauth:
            return

        await async_load_tokens_from_store(
            self.hass, self._anycubic_api, self.entry.entry_id
        )

    async def _async_check_login_errors(self) -> dict[str, str]:
        # Worded as a question, not a statement -- the old "checking auth was
        # successful" read as a success message and was logged immediately
        # before every failure.
        LOGGER.debug("Config flow checking whether authentication succeeded.")
        assert self._anycubic_api

        # Logged whether or not it works: when a token is refused, its own
        # claims are the fastest way to see why, and a report that already
        # contains them saves a round of questions.
        LOGGER.debug("Pasted token claims: %s", describe_token(self._user_token))

        success = await self._anycubic_api.check_api_tokens()
        if not success:
            wrong_kind = (
                None
                if self._user_region is AnycubicRegion.CHINA
                else token_type_looks_wrong(self._user_token)
            )

            if wrong_kind:
                LOGGER.error(
                    "That token is a %s, not an %s -- Anycubic refuses it with "
                    "'User does not exist'.",
                    wrong_kind,
                    TOKEN_TYPE_EXPECTED,
                )
                return {"base": "wrong_token_type"}

            LOGGER.error("Authentication failed. Check credentials.")
            return {"base": "invalid_auth"}

        LOGGER.debug("Config flow auth successful.")

        return {}

    async def _async_check_authentication_with_user_input(
        self,
        auth_mode: AnycubicAuthMode,
        user_input: dict[str, Any],
    ) -> dict[str, str]:
        try:
            self._user_token = remove_quotes_from_string(user_input[CONF_USER_TOKEN])
        except TypeError as error:
            LOGGER.warning(f"Token appears invalid: {error}")

            self._user_token = user_input[CONF_USER_TOKEN]

        self._user_auth_mode = auth_mode
        self._user_device_id = user_input.get(CONF_USER_DEVICE_ID)

        try:
            await self._async_check_anycubic_api_instance_exists()
            errors = await self._async_check_login_errors()

        except Exception as error:
            tb = traceback.format_exc()
            LOGGER.debug(f"Error during authentication with user_input: {error}\n{tb}")
            errors = self._errors_unknown_authentication_failure(error)

        return errors

    async def async_step_auth_mode_pick(
        self, _: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Authentication mode selection."""

        return self.async_show_menu(
            step_id="auth_mode_pick",
            menu_options=["auth_mode_web", "auth_mode_slicer", "auth_mode_android"],
        )

    async def async_step_auth_mode_web(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Handle the auth_mode_web step."""
        return await self._async_handle_auth_mode_step(
            step_id="auth_mode_web",
            auth_mode=AnycubicAuthMode.WEB,
            auth_schema=DATA_SCHEMA_AUTH_WEB,
            user_input=user_input,
        )

    async def async_step_auth_mode_slicer(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Handle the auth_mode_slicer step."""
        return await self._async_handle_auth_mode_step(
            step_id="auth_mode_slicer",
            auth_mode=AnycubicAuthMode.SLICER,
            auth_schema=DATA_SCHEMA_AUTH_SLICER,
            user_input=user_input,
        )

    async def async_step_auth_mode_android(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Handle the auth_mode_android step."""
        return await self._async_handle_auth_mode_step(
            step_id="auth_mode_android",
            auth_mode=AnycubicAuthMode.ANDROID,
            auth_schema=DATA_SCHEMA_AUTH_ANDROID,
            user_input=user_input,
        )

    async def _async_handle_auth_mode_step(
        self,
        step_id: str,
        auth_mode: AnycubicAuthMode,
        auth_schema: vol.Schema,
        user_input: dict[str, Any] | None = None,
    ) -> ConfigFlowResult:
        """Handle authentication step."""
        errors = {}

        if user_input is not None:
            LOGGER.debug("Handling auth step with user_input.")
            errors = await self._async_check_authentication_with_user_input(
                auth_mode=auth_mode,
                user_input=user_input,
            )

            if not errors:
                if self.entry:
                    self.hass.config_entries.async_update_entry(
                        self.entry,
                        data={
                            **self.entry.data,
                            CONF_USER_TOKEN: self._user_token,
                            CONF_USER_AUTH_MODE: self._user_auth_mode,
                            CONF_REGION: self._user_region.value,
                            CONF_USER_DEVICE_ID: self._user_device_id,
                        },
                    )
                    return self.async_abort(reason="reauth_successful")

                else:
                    return await self.async_step_printer()

        return self.async_show_form(
            step_id=step_id,
            data_schema=auth_schema,
            errors=errors,
        )

    async def async_step_printer(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the printer step."""
        errors = {}
        printer_id_map = {}

        try:
            LOGGER.debug("Config flow step: Printer")
            if self._is_reconfigure and not self._is_reauth:
                LOGGER.debug("Fetching existing entry for printer auth.")
                self.entry = self.hass.config_entries.async_get_entry(self.context["entry_id"])

                assert self.entry

                self._user_token = self.entry.data[CONF_USER_TOKEN]
                self._user_auth_mode = self.entry.data.get(CONF_USER_AUTH_MODE)
                self._user_device_id = self.entry.data.get(CONF_USER_DEVICE_ID)
                self._user_region = region_from_entry_data(self.entry.data)

            await self._async_check_anycubic_api_instance_exists()
            errors = await self._async_check_login_errors()

            assert self._anycubic_api

            printer_list = await self._anycubic_api.list_my_printers(ignore_init_errors=True)

            if printer_list is None or len(printer_list) < 1:
                LOGGER.error("No printers found. Check config.")
                errors = {"base": "no_printers"}

            printer_id_map = {f"{x.id}": x.name for x in printer_list}

        except Exception as error:
            tb = traceback.format_exc()
            LOGGER.debug(f"Error during printers list fetch: {error}\n{tb}")
            errors = self._errors_unknown_authentication_failure(error)

        if user_input and not errors:
            assert self._anycubic_api

            printer_id_list = list([int(x) for x in user_input[CONF_PRINTER_ID_LIST]])

            for printer_id in printer_id_list:
                try:
                    printer_status = await self._anycubic_api.printer_info_for_id(printer_id, ignore_init_errors=True)

                    if printer_status is None:
                        LOGGER.error("Printer not found. Check config.")
                        errors = {"base": "invalid_printer"}
                        break

                except Exception as error:
                    tb = traceback.format_exc()
                    LOGGER.debug(f"Error during printer info fetch: {error}\n{tb}")
                    errors = self._errors_unknown_authentication_failure(error)
                    break

            if not errors:
                existing_entry = await self.async_set_unique_id(
                    f"{self._anycubic_api.anycubic_auth.api_user_id}"
                )
                if existing_entry and self.entry:
                    self.hass.config_entries.async_update_entry(
                        existing_entry,
                        data={
                            **self.entry.data,
                            CONF_USER_TOKEN: self._user_token,
                            CONF_USER_AUTH_MODE: self._user_auth_mode,
                            CONF_REGION: self._user_region.value,
                            CONF_USER_DEVICE_ID: self._user_device_id,
                            CONF_PRINTER_ID_LIST: printer_id_list,
                        },
                    )
                    return self.async_abort(reason="reconfigure_successful")

                # Setting the unique id doesn't enforce it. Without this, adding
                # the same Anycubic account a second time creates a duplicate
                # entry and a second copy of every device and entity.
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title=self._anycubic_api.anycubic_auth.api_user_identifier,
                    data={
                        CONF_USER_TOKEN: self._user_token,
                        CONF_USER_AUTH_MODE: self._user_auth_mode,
                        CONF_REGION: self._user_region.value,
                        CONF_USER_DEVICE_ID: self._user_device_id,
                        CONF_PRINTER_ID_LIST: printer_id_list,
                    },
                )

        return self.async_show_form(
            step_id="printer",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_PRINTER_ID_LIST): cv.multi_select(printer_id_map),
                },
            ),
            errors=errors,
        )

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask how to reach the printer before asking for anything else.

        LAN Mode needs no Anycubic account at all, so leading with the token
        made people hunt through a memory dump for a credential they did not
        need. Cloud stays first because it is what most printers are on.
        """
        return self.async_show_menu(
            step_id="user",
            menu_options=["cloud", "local"],
        )

    async def async_step_local(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Set up against the printer alone -- no token, no account.

        The handshake proves the printer is reachable and actually in LAN
        Mode before an entry is created, so a printer still on the cloud says
        so here rather than producing an entry that never works.
        """
        errors: dict[str, str] = {}
        host = self._discovered_host or ""

        if user_input is not None:
            host = str(user_input.get(CONF_LAN_HOST) or "").strip()

            broker = None

            if not host:
                errors[CONF_LAN_HOST] = "lan_host_required"
            else:
                errors, broker = await async_lan_handshake(self.hass, host)

            if not errors and broker is not None:
                # The printer's own id, since there is no cloud account to
                # enumerate printers from.
                printer_id = lan_printer_id(broker.device_id)
                await self.async_set_unique_id(
                    format_mac(broker.mac) if broker.mac else f"lan-{host}"
                )
                self._abort_if_unique_id_configured(updates={CONF_LAN_HOST: host})

                return self.async_create_entry(
                    title=broker.model_name or f"Anycubic ({host})",
                    data={
                        CONF_LAN_HOST: host,
                        CONF_PRINTER_ID_LIST: [printer_id],
                    },
                    options={
                        CONF_LAN_MODE_ENABLED: True,
                        CONF_LAN_HOST: host,
                    },
                )

        return self.async_show_form(
            step_id="local",
            data_schema=vol.Schema({
                vol.Required(CONF_LAN_HOST, default=host): cv.string,
            }),
            errors=errors,
        )

    async def async_step_dhcp(
        self, discovery_info: DhcpServiceInfo
    ) -> ConfigFlowResult:
        """A printer appeared on the network.

        Offered as a local setup with the address filled in, because that is
        the path that needs nothing else from the user. Someone who wants the
        cloud can still pick it from the menu.
        """
        await self.async_set_unique_id(format_mac(discovery_info.macaddress))
        self._abort_if_unique_id_configured(
            updates={CONF_LAN_HOST: discovery_info.ip}
        )

        self._discovered_host = discovery_info.ip
        self.context["title_placeholders"] = {"name": f"Anycubic ({discovery_info.ip})"}

        return await self.async_step_confirm_discovery()

    async def async_step_confirm_discovery(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Confirm a discovered printer before doing anything with it."""
        if user_input is not None:
            return await self.async_step_user()

        return self.async_show_form(
            step_id="confirm_discovery",
            description_placeholders={"host": self._discovered_host or ""},
        )

    async def async_step_cloud(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the token step: one paste, mode detected automatically.

        Users can't reasonably choose between Web/Slicer/Android before they
        have a token in hand, so we don't ask. Paste whatever you have and the
        mode is inferred from its shape, with the alternatives tried as a
        fallback if the first guess is rejected.
        """
        errors: dict[str, str] = {}

        if user_input is not None:
            raw_token = user_input.get(CONF_USER_TOKEN)
            device_id = (user_input.get(CONF_USER_DEVICE_ID) or "").strip() or None
            # Set before anything authenticates: it decides which
            # service the token is sent to.
            self._user_region = resolve_region(user_input.get(CONF_REGION))
            token = extract_pasted_token(raw_token)

            if not token:
                errors = {CONF_USER_TOKEN: "invalid_token_format"}
            else:
                token, errors = await self._async_precheck_token(token)

                if not errors:
                    errors = await self._async_authenticate_detecting_mode(
                        token, device_id
                    )

                if not errors:
                    if self.entry:
                        self.hass.config_entries.async_update_entry(
                            self.entry,
                            data={
                                **self.entry.data,
                                CONF_USER_TOKEN: self._user_token,
                                CONF_USER_AUTH_MODE: self._user_auth_mode,
                                CONF_REGION: self._user_region.value,
                                CONF_USER_DEVICE_ID: self._user_device_id,
                            },
                        )
                        return self.async_abort(reason="reauth_successful")

                    return await self.async_step_printer()

        return self.async_show_form(
            step_id="cloud",
            data_schema=DATA_SCHEMA_TOKEN,
            errors=errors,
            # hassfest forbids URLs inside translation files, so it is passed in.
            description_placeholders={"tools_url": TOOLS_URL},
        )

    async def _async_precheck_token(self, token: str) -> tuple[str, dict[str, str]]:
        """Judge the pasted token locally before the server sees it.

        Anycubic's login answers every invalid token -- corrupted, truncated,
        expired or stale -- with the same "User does not exist", which reads
        as an account problem and sends people entirely the wrong way (issue
        #8 burned a full day on that). An expired or signature-broken token
        can be named as exactly that, right here.

        Returns the token to carry on with, which may have had stray trailing
        bytes trimmed off its signature.
        """
        expiry = token_expiry_timestamp(token)
        if expiry is not None and expiry <= int(time.time()):
            LOGGER.error("Pasted token expired on %s.", dt_util.utc_from_timestamp(expiry))
            return token, {CONF_USER_TOKEN: "token_expired"}

        checked, corrupt = await async_repair_access_token(
            async_get_clientsession(self.hass), token
        )

        if corrupt:
            LOGGER.error(
                "Pasted token failed local signature verification -- it was "
                "damaged in copying, or reassembled wrongly from a memory dump."
            )
            return token, {CONF_USER_TOKEN: "token_corrupted"}

        if checked != token:
            LOGGER.debug(
                "Trimmed %d stray character(s) from the pasted token's "
                "signature; it verifies once they are removed.",
                len(token) - len(checked),
            )

        return checked, {}

    async def _async_authenticate_detecting_mode(
        self,
        token: str,
        device_id: str | None,
    ) -> dict[str, str]:
        """Try the most likely auth mode first, then the plausible others.

        The token's shape is a strong hint but not a guarantee, so rather than
        failing and making the user guess, we try the alternatives before
        reporting an error.
        """
        first_choice = detect_auth_mode(token, device_id)

        if device_id:
            # A device id is only meaningful for the Android flow.
            modes = [AnycubicAuthMode.ANDROID]
        else:
            modes = [first_choice] + [
                mode
                for mode in (AnycubicAuthMode.SLICER, AnycubicAuthMode.WEB)
                if mode is not first_choice
            ]

        errors: dict[str, str] = {}

        for mode in modes:
            # Each attempt needs a fresh API instance, since a failed login
            # leaves the previous one holding rejected credentials.
            self._anycubic_api = None

            errors = await self._async_check_authentication_with_user_input(
                auth_mode=mode,
                user_input={
                    CONF_USER_TOKEN: token,
                    CONF_USER_DEVICE_ID: device_id,
                },
            )

            if not errors:
                LOGGER.debug("Authenticated using detected auth mode %s.", mode.name)
                return {}

        return errors

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        """Handle initiation of re-authentication with AnycubicCloud."""
        self._is_reauth = True
        self.entry = self.hass.config_entries.async_get_entry(self.context["entry_id"])
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Re-authenticate with the same single paste as first-time setup.

        Straight to the token form, not the connection menu: an entry only
        needs re-authenticating because it uses a cloud account, so asking
        again how to reach the printer would be a question already answered.
        """
        return await self.async_step_cloud(user_input)

    async def async_step_reconfigure(
        self, _: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle a reconfiguration flow initialized by the user."""

        self._is_reconfigure = True

        return await self.async_step_reauth_or_choose_printer()

    async def async_step_reauth_or_choose_printer(
        self, _: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Re-authenticate or select printer menu.."""

        return self.async_show_menu(
            step_id="reauth_or_choose_printer",
            menu_options=["reauth", "printer", "connection"],
        )

    async def async_step_connection(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Switch between the cloud and the printer's own local connection.

        Kept here rather than only in options because this is what someone
        reaches for after flipping LAN Mode at the printer -- at which point
        the cloud has dropped the printer and the entry may not be loaded.
        """
        errors: dict[str, str] = {}
        entry = self.entry

        if entry is None:
            return self.async_abort(reason="reconfigure_successful")

        if user_input:
            host = str(user_input.get(CONF_LAN_HOST) or "").strip()
            enabled = bool(user_input.get(CONF_LAN_MODE_ENABLED))

            if enabled and not host:
                errors[CONF_LAN_HOST] = "lan_host_required"
            elif enabled:
                errors = await self._async_check_lan_host(host)

            if not errors:
                self.hass.config_entries.async_update_entry(
                    entry,
                    options={
                        **entry.options,
                        CONF_LAN_MODE_ENABLED: enabled,
                        CONF_LAN_HOST: host,
                    },
                )
                return self.async_abort(reason="reconfigure_successful")

        return self.async_show_form(
            step_id="connection",
            data_schema=vol.Schema({
                vol.Optional(
                    CONF_LAN_MODE_ENABLED,
                    default=entry.options.get(CONF_LAN_MODE_ENABLED, False),
                ): BooleanSelector(),
                vol.Optional(
                    CONF_LAN_HOST,
                    default=entry.options.get(CONF_LAN_HOST, ""),
                ): cv.string,
            }),
            errors=errors,
        )

    async def _async_check_lan_host(self, host: str) -> dict[str, str]:
        return await check_lan_host(self.hass, host)


class AnycubicCloudOptionsFlowHandler(OptionsFlow):
    """Handle Anycubic Cloud options."""

    def __init__(self, entry: ConfigEntry) -> None:
        """Initialize Anycubic Cloud options flow."""
        self.entry = entry
        self._anycubic_api: AnycubicAPI | None = None
        self._supports_drying = False

    def _build_drying_options_schema(self) -> vol.Schema:
        schema: dict[Any, Any] = dict()

        for x in range(MAX_DRYING_PRESETS):
            num = x + 1

            dur_key = f"{CONF_DRYING_PRESET_DURATION_}{num}"
            schema[vol.Optional(
                dur_key,
                default=self.entry.options.get(dur_key, vol.UNDEFINED)
            )] = cv.positive_int

            temp_key = f"{CONF_DRYING_PRESET_TEMPERATURE_}{num}"
            schema[vol.Optional(
                temp_key,
                default=self.entry.options.get(temp_key, vol.UNDEFINED)
            )] = cv.positive_int

        return vol.Schema(schema)

    async def _async_check_printer_options(self) -> None:
        try:
            self._anycubic_api = async_create_anycubic_api(
                self.hass,
                self.entry.data[CONF_USER_TOKEN],
                self.entry.data.get(CONF_USER_AUTH_MODE),
                self.entry.data.get(CONF_USER_DEVICE_ID),
                region_from_entry_data(self.entry.data),
            )

            await async_load_tokens_from_store(
                self.hass,
                self._anycubic_api,
                self.entry.entry_id if self.entry else None,
            )
            await self._anycubic_api.check_api_tokens()

            printer_list = await self._anycubic_api.list_my_printers()

            if printer_list and len(printer_list) > 0:
                for printer in printer_list:

                    if printer.supports_function_multi_color_box:
                        self._supports_drying = True
                        break

        except Exception:
            self._anycubic_api = None

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage Anycubic Cloud options."""
        return await self.async_step_options_menu()

    async def async_step_options_menu(
        self, _: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Options menu."""

        await self._async_check_printer_options()

        menu_options = list([
            "mqtt",
            "local",
            "card_config",
            "debug",
        ])

        if self._supports_drying:
            menu_options.insert(1, "drying")

        return self.async_show_menu(
            step_id="options_menu",
            menu_options=menu_options,
        )

    @callback
    def async_create_entry_with_existing_options(
        self,
        user_input: Mapping[str, Any],
    ) -> ConfigFlowResult:
        return self.async_create_entry(
            data={
                **self.entry.options,
                **user_input,
            }
        )

    async def async_step_mqtt(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage Anycubic Cloud MQTT options."""
        if user_input:
            return self.async_create_entry_with_existing_options(user_input)

        default_mqtt_connect_mode = self.entry.options.get(
            CONF_MQTT_CONNECT_MODE,
            AnycubicMQTTConnectMode.Printing_Only,
        )

        return self.async_show_form(
            step_id="mqtt",
            data_schema=vol.Schema({
                vol.Optional(
                    CONF_MQTT_CONNECT_MODE, default=default_mqtt_connect_mode
                ): vol.In(MQTT_CONNECT_MODES)
            }),
            errors={},
        )

    async def async_step_local(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the local (LAN Mode) connection."""
        errors: dict[str, str] = {}

        if user_input:
            host = str(user_input.get(CONF_LAN_HOST) or "").strip()
            enabled = bool(user_input.get(CONF_LAN_MODE_ENABLED))

            if not enabled:
                return self.async_create_entry_with_existing_options({
                    CONF_LAN_MODE_ENABLED: False,
                    CONF_LAN_HOST: host,
                })

            if not host:
                errors[CONF_LAN_HOST] = "lan_host_required"
            else:
                # Check the printer before saving. Turning this on when the
                # printer is still in cloud mode would otherwise leave the
                # integration with no working connection at all.
                errors = await check_lan_host(self.hass, host)

                if not errors:
                    return self.async_create_entry_with_existing_options({
                        CONF_LAN_MODE_ENABLED: True,
                        CONF_LAN_HOST: host,
                    })

        return self.async_show_form(
            step_id="local",
            data_schema=vol.Schema({
                vol.Optional(
                    CONF_LAN_MODE_ENABLED,
                    default=self.entry.options.get(CONF_LAN_MODE_ENABLED, False),
                ): BooleanSelector(),
                vol.Optional(
                    CONF_LAN_HOST,
                    default=self.entry.options.get(CONF_LAN_HOST, ""),
                ): cv.string,
            }),
            errors=errors,
        )

    async def async_step_drying(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage Anycubic Cloud drying options."""
        if user_input:
            return self.async_create_entry_with_existing_options(user_input)

        return self.async_show_form(
            step_id="drying",
            data_schema=self._build_drying_options_schema(),
            errors={},
        )

    async def async_step_card_config(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage Anycubic Cloud card_config options."""
        if user_input:
            if isinstance(user_input[CONF_CARD_CONFIG], dict):
                user_input[CONF_CARD_CONFIG] = extract_panel_card_config(
                    user_input[CONF_CARD_CONFIG]
                )
            return self.async_create_entry_with_existing_options(user_input)

        default_card_config = self.entry.options.get(
            CONF_CARD_CONFIG,
            None,
        )

        return self.async_show_form(
            step_id="card_config",
            data_schema=vol.Schema({
                vol.Optional(
                    CONF_CARD_CONFIG, default=default_card_config
                ): ObjectSelector()
            }),
            errors={},
        )

    async def async_step_debug(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage Anycubic Cloud debug options."""
        if user_input:
            return self.async_create_entry_with_existing_options(user_input)

        default_debug_all = self.entry.options.get(
            CONF_DEBUG_DEPRECATED,
            False,
        )

        default_debug_api = self.entry.options.get(
            CONF_DEBUG_API_CALLS,
            default_debug_all,
        )

        default_debug_mqtt = self.entry.options.get(
            CONF_DEBUG_MQTT_MSG,
            default_debug_all,
        )

        return self.async_show_form(
            step_id="debug",
            data_schema=vol.Schema({
                vol.Optional(
                    CONF_DEBUG_API_CALLS, default=default_debug_api
                ): BooleanSelector(),
                vol.Optional(
                    CONF_DEBUG_MQTT_MSG, default=default_debug_mqtt
                ): BooleanSelector(),
            }),
            errors={},
        )
