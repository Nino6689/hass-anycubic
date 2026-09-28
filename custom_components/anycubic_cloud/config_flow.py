"""Config and options flows (BEHAVIOUR §5.8, §5.9; step ids in COMPAT §1).

Cloud setup: the ``cloud`` form takes a pasted token, extracts and checks it
locally, then signs in trying the modes in the order of PROTOCOL A §2.9;
``printer`` picks the account's printers. Re-authentication and reconfigure
reuse both. LAN setup, DHCP discovery and the options are as in the LAN
release.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from anycubic_cloud_client import (
    AnycubicCloudClient,
    AnycubicCloudError,
    AuthMode,
    CloudSecrets,
    CredentialsRejectedError,
    PrinterSummary,
    RejectReason,
    ServiceUnavailableError,
    SignatureStatus,
    SignInResult,
    UnexpectedResponseError,
    decode_claims,
    extract_token,
    sign_in_any,
    verify_token_signature,
)
from anycubic_lan import (
    AnycubicLanError,
    LanModeDisabledError,
    PrinterConnectionInfo,
    UnsupportedPrinterError,
    handshake,
)
from homeassistant.config_entries import (
    SOURCE_REAUTH,
    SOURCE_RECONFIGURE,
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlowWithReload,
)
from homeassistant.core import callback
from homeassistant.helpers import device_registry as dr, selector
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.device_registry import format_mac
import voluptuous as vol

from .cloud import TokenStore, async_delete_token_store, async_hand_off_sign_in
from .const import (
    CARD_CONFIG_BOOL_KEYS,
    CARD_CONFIG_LIST_KEYS,
    CARD_CONFIG_NUMBER_KEYS,
    CARD_CONFIG_STR_KEYS,
    CONF_CARD_CONFIG,
    CONF_DEBUG_API_CALLS,
    CONF_DEBUG_DEPRECATED,
    CONF_DEBUG_MQTT_MSG,
    CONF_DRYING_PRESET_DURATION,
    CONF_DRYING_PRESET_TEMPERATURE,
    CONF_LAN_HOST,
    CONF_LAN_MODE_ENABLED,
    CONF_MQTT_CONNECT_MODE,
    CONF_PRINTER_IDS,
    CONF_REGION,
    CONF_USER_AUTH_MODE,
    CONF_USER_DEVICE_ID,
    CONF_USER_TOKEN,
    DEFAULT_MQTT_CONNECT_MODE,
    DOMAIN,
    DRYING_PRESETS,
    MQTT_CONNECT_MODES,
    REGION_CHINA,
    REGION_INTERNATIONAL,
)
from .credentials import async_get_cloud_secrets
from .identity import entry_unique_id_for_lan, is_cloud_entry, lan_printer_id

if TYPE_CHECKING:
    from homeassistant.helpers.service_info.dhcp import DhcpServiceInfo

_LOGGER = logging.getLogger(__name__)

ABORT_NO_CREDENTIALS = "cloud_credentials_unavailable"
LEGACY_MODES = {
    "auth_mode_web": AuthMode.WEB,
    "auth_mode_slicer": AuthMode.SLICER,
    "auth_mode_android": AuthMode.ANDROID,
}


async def _async_try_handshake(
    flow: ConfigFlow | OptionsFlowWithReload, host: str
) -> tuple[PrinterConnectionInfo | None, dict[str, str]]:
    """Validate a printer address; errors as in BEHAVIOUR §5.8 ``local``."""
    if not host.strip():
        return None, {CONF_LAN_HOST: "lan_host_required"}
    try:
        info = await handshake(async_get_clientsession(flow.hass), host.strip())
    except LanModeDisabledError:
        return None, {"base": "lan_printer_in_cloud_mode"}
    except UnsupportedPrinterError:
        return None, {"base": "lan_unsupported_printer"}
    except AnycubicLanError:
        return None, {"base": "lan_unreachable"}
    except Exception:
        _LOGGER.exception("Unexpected error during the LAN handshake")
        return None, {"base": "lan_unreachable"}
    return info, {}


def _lan_schema(enabled: bool, host: str) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_LAN_MODE_ENABLED, default=enabled): bool,
            vol.Optional(CONF_LAN_HOST, default=host): str,
        }
    )


class AnycubicConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up a printer."""

    VERSION = 1
    MINOR_VERSION = 1

    def __init__(self) -> None:
        self._discovered_host: str | None = None
        self._cloud_data: dict[str, Any] = {}
        self._cloud_title = ""
        self._cloud_tokens: SignInResult
        self._reconfigure_client: AnycubicCloudClient | None = None

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> AnycubicOptionsFlow:
        return AnycubicOptionsFlow()

    # -- new entries -----------------------------------------------------------

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        return self.async_show_menu(step_id="user", menu_options=["cloud", "local"])

    async def async_step_cloud(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Paste a token; extract, pre-check, then sign in (§5.8)."""
        secrets = await async_get_cloud_secrets(self.hass)
        if secrets is None:
            return self.async_abort(reason=ABORT_NO_CREDENTIALS)
        entry = self._entry_being_changed()
        region = str(
            (entry.data.get(CONF_REGION) if entry else None) or REGION_INTERNATIONAL
        )
        if region not in (REGION_INTERNATIONAL, REGION_CHINA):
            region = REGION_INTERNATIONAL
        errors: dict[str, str] = {}
        device_id = ""
        if user_input is not None:
            region = user_input.get(CONF_REGION, region)
            device_id = str(user_input.get(CONF_USER_DEVICE_ID) or "").strip()
            token, errors = await self._async_check_token(user_input[CONF_USER_TOKEN])
            if token is not None:
                try:
                    result = await sign_in_any(
                        async_get_clientsession(self.hass),
                        secrets,
                        token,
                        device_id=device_id or None,
                        region=region,
                    )
                except Exception as err:
                    errors = {"base": _sign_in_error(err)}
                else:
                    return await self._async_signed_in(
                        result, token, device_id or None, region
                    )
        schema = vol.Schema(
            {
                vol.Required(CONF_USER_TOKEN): selector.TextSelector(
                    selector.TextSelectorConfig(multiline=True)
                ),
                vol.Optional(
                    CONF_USER_DEVICE_ID, description={"suggested_value": device_id}
                ): str,
                vol.Required(CONF_REGION, default=region): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[REGION_INTERNATIONAL, REGION_CHINA],
                        translation_key=CONF_REGION,
                        mode=selector.SelectSelectorMode.DROPDOWN,
                    )
                ),
            }
        )
        return self.async_show_form(step_id="cloud", data_schema=schema, errors=errors)

    async def _async_check_token(
        self, pasted: str
    ) -> tuple[str | None, dict[str, str]]:
        """Local pre-checks: extraction, expiry, the RS256 signature (§5.8)."""
        token = extract_token(pasted)
        if token is None:
            return None, {CONF_USER_TOKEN: "invalid_token_format"}
        claims = decode_claims(token)
        if claims is not None and claims.is_expired():
            return None, {CONF_USER_TOKEN: "token_expired"}
        check = await verify_token_signature(async_get_clientsession(self.hass), token)
        if check.status in (SignatureStatus.CORRUPTED, SignatureStatus.INVALID):
            return None, {CONF_USER_TOKEN: "token_corrupted"}
        # An over-long signature comes back trimmed.
        return check.token, {}

    def _entry_being_changed(self) -> ConfigEntry | None:
        if self.source == SOURCE_REAUTH:
            return self._get_reauth_entry()
        if self.source == SOURCE_RECONFIGURE:
            return self._get_reconfigure_entry()
        return None

    async def _async_signed_in(
        self,
        result: SignInResult,
        token: str,
        device_id: str | None,
        region: str,
        *,
        legacy: bool = False,
    ) -> ConfigFlowResult:
        user_id = result.account.user_id
        unique_id = str(user_id) if user_id is not None else result.account.identifier
        data = {
            CONF_USER_TOKEN: token,
            CONF_USER_AUTH_MODE: int(result.auth_mode),
            CONF_USER_DEVICE_ID: device_id,
            CONF_REGION: region,
        }
        entry = self._entry_being_changed()
        if entry is not None:
            if entry.unique_id and entry.unique_id != unique_id:
                # Another account's token (E2-Q6 in docs/QUESTIONS.md).
                return self.async_abort(reason="wrong_account")
            if legacy:
                # The legacy steps neither clear the store nor reload (§5.8).
                self.hass.config_entries.async_update_entry(
                    entry, data={**entry.data, **data}
                )
                return self.async_abort(reason="reauth_successful")
            # PROTOCOL A §5.3 rule 4: the new token, mode, region and device id
            # on the entry; the old session deleted so it cannot overwrite
            # them; a reload; then done. The sign-in's own tokens are handed
            # to that setup so it does not exchange again (acceptance L2).
            await async_delete_token_store(self.hass, entry.entry_id)
            async_hand_off_sign_in(self.hass, token, result.tokens)
            return self.async_update_reload_and_abort(
                entry, data={**entry.data, **data}, reason="reauth_successful"
            )
        await self.async_set_unique_id(unique_id)
        self._abort_if_unique_id_configured()
        self._cloud_data = data
        self._cloud_title = result.account.identifier
        self._cloud_tokens = result
        return await self.async_step_printer()

    # -- legacy fixed-mode steps (BEHAVIOUR §5.8 last row; DECISIONS V9) -----

    async def async_step_auth_mode_pick(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Not offered by any menu, as in 2.x; kept for their step ids
        (E2-Q4 in docs/QUESTIONS.md)."""
        return self.async_show_menu(
            step_id="auth_mode_pick", menu_options=list(LEGACY_MODES)
        )

    async def async_step_auth_mode_web(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        return await self._async_legacy_step("auth_mode_web", user_input)

    async def async_step_auth_mode_slicer(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        return await self._async_legacy_step("auth_mode_slicer", user_input)

    async def async_step_auth_mode_android(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        return await self._async_legacy_step("auth_mode_android", user_input)

    async def _async_legacy_step(
        self, step_id: str, user_input: dict[str, Any] | None
    ) -> ConfigFlowResult:
        """Log in with one fixed mode: quotes stripped, no other checks."""
        secrets = await async_get_cloud_secrets(self.hass)
        if secrets is None:
            return self.async_abort(reason=ABORT_NO_CREDENTIALS)
        mode = LEGACY_MODES[step_id]
        errors: dict[str, str] = {}
        if user_input is not None:
            token = str(user_input[CONF_USER_TOKEN]).strip().strip("\"'")
            device_id = str(user_input.get(CONF_USER_DEVICE_ID) or "").strip() or None
            result, errors = await self._async_sign_in_mode(
                secrets, token, mode, device_id
            )
            if result is not None:
                return await self._async_signed_in(
                    result, token, device_id, REGION_INTERNATIONAL, legacy=True
                )
        fields: dict[vol.Marker, Any] = {vol.Required(CONF_USER_TOKEN): str}
        if mode is AuthMode.ANDROID:
            fields[vol.Required(CONF_USER_DEVICE_ID)] = str
        return self.async_show_form(
            step_id=step_id, data_schema=vol.Schema(fields), errors=errors
        )

    async def _async_sign_in_mode(
        self,
        secrets: CloudSecrets,
        token: str,
        mode: AuthMode,
        device_id: str | None,
    ) -> tuple[SignInResult | None, dict[str, str]]:
        client = AnycubicCloudClient.from_entry(
            async_get_clientsession(self.hass),
            secrets,
            token=token,
            auth_mode=mode,
            region=REGION_INTERNATIONAL,
            device_id=device_id,
        )
        try:
            account = await client.check()
        except Exception as err:
            return None, {"base": _sign_in_error(err)}
        return (
            SignInResult(
                auth_mode=mode,
                account=account,
                tokens=client.token_state,
                client=client,
            ),
            {},
        )

    async def async_step_local(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        host = self._discovered_host or ""
        if user_input is not None:
            host = user_input.get(CONF_LAN_HOST, "").strip()
            info, errors = await _async_try_handshake(self, host)
            if info is not None:
                return await self._async_create_lan_entry(info, host)
        return self.async_show_form(
            step_id="local",
            data_schema=vol.Schema({vol.Optional(CONF_LAN_HOST, default=host): str}),
            errors=errors,
        )

    async def _async_create_lan_entry(
        self, info: PrinterConnectionInfo, host: str
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(entry_unique_id_for_lan(info.mac, host))
        if existing := self.hass.config_entries.async_entry_for_domain_unique_id(
            DOMAIN, self.unique_id or ""
        ):
            self._async_update_host(existing, host)
            return self.async_abort(reason="already_configured")
        title = info.discovery.model_name or f"Anycubic ({host})"
        return self.async_create_entry(
            title=title,
            data={
                CONF_LAN_HOST: host,
                CONF_PRINTER_IDS: [lan_printer_id(info.device_id)],
            },
            options={CONF_LAN_MODE_ENABLED: True, CONF_LAN_HOST: host},
        )

    @callback
    def _async_update_host(self, entry: ConfigEntry, host: str) -> None:
        """Move an entry to a new address - the one the connection reads (G24)."""
        options = dict(entry.options)
        if entry.options.get(CONF_LAN_HOST) == host:
            return
        options[CONF_LAN_HOST] = host
        data = dict(entry.data)
        if CONF_LAN_HOST in data or not is_cloud_entry(entry):
            data[CONF_LAN_HOST] = host
        self.hass.config_entries.async_update_entry(entry, data=data, options=options)
        self.hass.config_entries.async_schedule_reload(entry.entry_id)

    # -- DHCP discovery ----------------------------------------------------------

    async def async_step_dhcp(
        self, discovery_info: DhcpServiceInfo
    ) -> ConfigFlowResult:
        """A printer seen by DHCP (matchers confirmed, DECISIONS round 2, Q9.2)."""
        mac = format_mac(discovery_info.macaddress)
        host = discovery_info.ip
        await self.async_set_unique_id(mac)
        if existing := self.hass.config_entries.async_entry_for_domain_unique_id(
            DOMAIN, mac
        ):
            if existing.options.get(CONF_LAN_MODE_ENABLED):
                self._async_update_host(existing, host)
            return self.async_abort(reason="already_configured")
        # A printer of a cloud entry is keyed by account, not MAC: look for
        # the MAC among this integration's devices (B27).
        registry = dr.async_get(self.hass)
        connection = (dr.CONNECTION_NETWORK_MAC, mac)
        if any(
            connection in device.connections
            for entry in self.hass.config_entries.async_entries(DOMAIN)
            for device in dr.async_entries_for_config_entry(registry, entry.entry_id)
        ):
            return self.async_abort(reason="already_configured")
        self._discovered_host = host
        self.context["title_placeholders"] = {"name": f"Anycubic ({host})"}
        return await self.async_step_confirm_discovery()

    async def async_step_confirm_discovery(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return await self.async_step_user()
        return self.async_show_form(
            step_id="confirm_discovery",
            description_placeholders={"host": self._discovered_host or ""},
        )

    # -- re-authentication and reconfigure ---------------------------------------

    async def async_step_reauth(self, entry_data: Any = None) -> ConfigFlowResult:
        """Straight to the ``cloud`` form, region pre-filled (§5.6)."""
        return await self.async_step_cloud()

    async def async_step_printer(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Choose the account's printers (§5.8 ``printer``)."""
        errors: dict[str, str] = {}
        reconfigure = self.source == SOURCE_RECONFIGURE
        client = await self._async_printer_client()
        if client is None:
            return self.async_abort(reason=ABORT_NO_CREDENTIALS)
        printers: list[PrinterSummary] = []
        try:
            printers = [p for p in await client.get_printers() if p.id is not None]
        except UnexpectedResponseError:
            errors["base"] = "cannot_read_response"
        except Exception:
            errors["base"] = "cannot_connect"
        if not printers and not errors:
            errors["base"] = "no_printers"
        if user_input is not None and not errors:
            chosen = [int(pid) for pid in user_input.get(CONF_PRINTER_IDS) or []]
            errors = await self._async_check_printers(client, chosen)
            if not errors:
                return await self._async_printers_chosen(client, chosen)
        entry = self._entry_being_changed()
        current = (
            [str(pid) for pid in (entry.data.get(CONF_PRINTER_IDS) or [])]
            if (entry and reconfigure)
            else []
        )
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_PRINTER_IDS, default=current
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            selector.SelectOptionDict(
                                value=str(p.id), label=p.name or str(p.id)
                            )
                            for p in printers
                        ],
                        multiple=True,
                        mode=selector.SelectSelectorMode.LIST,
                    )
                )
            }
        )
        return self.async_show_form(
            step_id="printer", data_schema=schema, errors=errors
        )

    async def _async_printer_client(self) -> AnycubicCloudClient | None:
        """New flows use the sign-in's client. Reconfigure uses the entry's
        token with its stored session - not a re-auth (§5.3 rule 6)."""
        if self.source != SOURCE_RECONFIGURE:
            return self._cloud_tokens.client
        if self._reconfigure_client is not None:
            return self._reconfigure_client
        secrets = await async_get_cloud_secrets(self.hass)
        if secrets is None:
            return None
        entry = self._get_reconfigure_entry()
        store = await TokenStore(self.hass, entry.entry_id).async_load()
        client = AnycubicCloudClient.from_entry(
            async_get_clientsession(self.hass),
            secrets,
            token=str(entry.data.get(CONF_USER_TOKEN) or ""),
            auth_mode=entry.data.get(CONF_USER_AUTH_MODE),
            region=entry.data.get(CONF_REGION),
            device_id=entry.data.get(CONF_USER_DEVICE_ID),
            store=store,
        )
        try:
            await client.check()
        except AnycubicCloudError as err:
            _LOGGER.debug("Reconfigure sign-in failed: %s", err)
        self._reconfigure_client = client
        return client

    @staticmethod
    async def _async_check_printers(
        client: AnycubicCloudClient, chosen: list[int]
    ) -> dict[str, str]:
        """Each chosen printer's record can be fetched."""
        if not chosen:
            return {"base": "no_printers"}
        for printer_id in chosen:
            try:
                await client.get_printer(printer_id)
            except UnexpectedResponseError:
                return {"base": "cannot_read_response"}
            except CredentialsRejectedError:
                return {"base": "invalid_auth"}
            except ServiceUnavailableError:
                return {"base": "cannot_connect"}
            except AnycubicCloudError:
                return {"base": "invalid_printer"}
            except Exception:
                return {"base": "cannot_connect"}
        return {}

    async def _async_printers_chosen(
        self, client: AnycubicCloudClient, chosen: list[int]
    ) -> ConfigFlowResult:
        if self.source == SOURCE_RECONFIGURE:
            entry = self._get_reconfigure_entry()
            if client.tokens_changed:
                await TokenStore(self.hass, entry.entry_id).async_save(
                    client.export_token_store()
                )
            return self.async_update_reload_and_abort(
                entry,
                data={**entry.data, CONF_PRINTER_IDS: chosen},
                reason="reconfigure_successful",
            )
        data = {**self._cloud_data, CONF_PRINTER_IDS: chosen}
        async_hand_off_sign_in(self.hass, data[CONF_USER_TOKEN], client.token_state)
        return self.async_create_entry(title=self._cloud_title, data=data, options={})

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        return await self.async_step_reauth_or_choose_printer()

    async def async_step_reauth_or_choose_printer(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        entry = self._get_reconfigure_entry()
        # G21: no account steps for LAN-only entries.
        options = (
            ["reauth", "printer", "connection"]
            if is_cloud_entry(entry)
            else ["connection"]
        )
        return self.async_show_menu(
            step_id="reauth_or_choose_printer", menu_options=options
        )

    async def async_step_connection(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """LAN settings of the entry being reconfigured (V14, G5)."""
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        enabled = bool(entry.options.get(CONF_LAN_MODE_ENABLED, False))
        host = str(
            entry.options.get(CONF_LAN_HOST) or entry.data.get(CONF_LAN_HOST) or ""
        )
        if user_input is not None:
            enabled = user_input[CONF_LAN_MODE_ENABLED]
            host = user_input.get(CONF_LAN_HOST, "").strip()
            if enabled:
                info, errors = await _async_try_handshake(self, host)
                if info is not None and not self._same_printer(entry, info, host):
                    errors = {"base": "lan_different_printer"}
            if not errors:
                options = {**entry.options, CONF_LAN_MODE_ENABLED: enabled}
                data = dict(entry.data)
                if enabled:
                    options[CONF_LAN_HOST] = host
                    if not is_cloud_entry(entry):
                        data[CONF_LAN_HOST] = host
                return self.async_update_reload_and_abort(
                    entry,
                    data=data,
                    options=options,
                    reason="reconfigure_successful",
                )
        return self.async_show_form(
            step_id="connection", data_schema=_lan_schema(enabled, host), errors=errors
        )

    @staticmethod
    def _same_printer(
        entry: ConfigEntry, info: PrinterConnectionInfo, host: str
    ) -> bool:
        """A LAN-only entry must keep talking to the printer it was set up for.

        Checked by MAC when the entry is keyed by one, else by the printer id
        derived from the broker's device id (COMPAT §2).
        """
        if is_cloud_entry(entry):
            return True
        unique_id = entry.unique_id or ""
        if unique_id and not unique_id.startswith("lan-") and info.mac:
            return unique_id == entry_unique_id_for_lan(info.mac, host)
        printer_ids = entry.data.get(CONF_PRINTER_IDS) or []
        if printer_ids:
            return lan_printer_id(info.device_id) == int(printer_ids[0])
        return True


def _sign_in_error(err: Exception) -> str:
    """The form error for a failed sign-in (BEHAVIOUR §5.8, PROTOCOL A §4.4).

    A rate limit is transient, never "invalid" (acceptance L2).
    """
    if isinstance(err, CredentialsRejectedError):
        if err.server_message and "请求过于频繁" in err.server_message:
            return "cannot_connect"
        if err.reason is RejectReason.WRONG_TOKEN_TYPE:
            return "wrong_token_type"
        return "invalid_auth"
    if isinstance(err, UnexpectedResponseError):
        return "cannot_read_response"
    if not isinstance(err, AnycubicCloudError):
        _LOGGER.error("Unexpected error signing in to the Anycubic cloud: %r", err)
    return "cannot_connect"


def _card_value_ok(key: str, item: object) -> bool:
    if key in CARD_CONFIG_BOOL_KEYS:
        return isinstance(item, bool)
    if key in CARD_CONFIG_STR_KEYS:
        return isinstance(item, str)
    if key in CARD_CONFIG_LIST_KEYS:
        return isinstance(item, str) or (
            isinstance(item, list) and all(isinstance(i, str) for i in item)
        )
    if key in CARD_CONFIG_NUMBER_KEYS:
        return isinstance(item, int | float) and not isinstance(item, bool)
    return False


def sanitize_card_config(value: dict[str, Any]) -> dict[str, Any]:
    """Keep the known card keys of the right type (BEHAVIOUR §5.9).

    ``false``, ``0``, empty values and whole-number ``scaleFactor`` are kept
    (DECISIONS frontend 3); a bare string list value is passed through.
    """
    return {key: item for key, item in value.items() if _card_value_ok(key, item)}


class AnycubicOptionsFlow(OptionsFlowWithReload):
    """Options; every save merges into the existing options and reloads."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        return await self.async_step_options_menu()

    def _save(
        self, changes: dict[str, Any], removed: tuple[str, ...] = ()
    ) -> ConfigFlowResult:
        options = {**self.config_entry.options, **changes}
        for key in removed:
            options.pop(key, None)
        return self.async_create_entry(data=options)

    def _has_no_ace(self) -> bool:
        """True only when every running printer is known to have no ACE:
        its cloud record lists no ACE function, or it said so over LAN (G21)."""
        runtime = getattr(self.config_entry, "runtime_data", None)
        coordinators = list(runtime.coordinators.values()) if runtime else []
        printers = [c.printer for c in coordinators if c.has_printer]
        if not printers:
            return False
        return all(
            not p.supports_ace
            and (
                p.peripherals.get("ace") is False
                or (p.cloud is not None and p.cloud.detail is not None)
            )
            for p in printers
        )

    async def async_step_options_menu(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        options: list[str] = []
        if is_cloud_entry(self.config_entry):
            options.append("mqtt")
        if not self._has_no_ace():
            options.append("drying")
        options += ["local", "card_config", "debug"]
        return self.async_show_menu(step_id="options_menu", menu_options=options)

    async def async_step_mqtt(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self._save(
                {CONF_MQTT_CONNECT_MODE: int(user_input[CONF_MQTT_CONNECT_MODE])}
            )
        current = self.config_entry.options.get(
            CONF_MQTT_CONNECT_MODE, DEFAULT_MQTT_CONNECT_MODE
        )
        schema = vol.Schema(
            {
                vol.Required(CONF_MQTT_CONNECT_MODE, default=str(current)): (
                    selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[str(mode) for mode in MQTT_CONNECT_MODES],
                            translation_key=CONF_MQTT_CONNECT_MODE,
                            mode=selector.SelectSelectorMode.DROPDOWN,
                        )
                    )
                )
            }
        )
        return self.async_show_form(step_id="mqtt", data_schema=schema)

    async def async_step_drying(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        keys = [
            key.format(number)
            for number in DRYING_PRESETS
            for key in (CONF_DRYING_PRESET_DURATION, CONF_DRYING_PRESET_TEMPERATURE)
        ]
        if user_input is not None:
            changes = {key: int(user_input[key]) for key in keys if key in user_input}
            removed = tuple(key for key in keys if key not in user_input)
            return self._save(changes, removed)
        fields: dict[vol.Marker, Any] = {}
        for key in keys:
            current = self.config_entry.options.get(key)
            marker = vol.Optional(
                key,
                description={"suggested_value": current}
                if current is not None
                else None,
            )
            fields[marker] = vol.All(vol.Coerce(int), vol.Range(min=0))
        return self.async_show_form(step_id="drying", data_schema=vol.Schema(fields))

    async def async_step_local(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        entry = self.config_entry
        errors: dict[str, str] = {}
        enabled = bool(entry.options.get(CONF_LAN_MODE_ENABLED, False))
        host = str(
            entry.options.get(CONF_LAN_HOST) or entry.data.get(CONF_LAN_HOST) or ""
        )
        if user_input is not None:
            enabled = user_input[CONF_LAN_MODE_ENABLED]
            host = user_input.get(CONF_LAN_HOST, "").strip()
            if not enabled:
                return self._save({CONF_LAN_MODE_ENABLED: False})
            info, errors = await _async_try_handshake(self, host)
            if info is not None:
                return self._save({CONF_LAN_MODE_ENABLED: True, CONF_LAN_HOST: host})
        return self.async_show_form(
            step_id="local", data_schema=_lan_schema(enabled, host), errors=errors
        )

    async def async_step_card_config(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            value = user_input.get(CONF_CARD_CONFIG) or {}
            if isinstance(value, dict):
                return self._save({CONF_CARD_CONFIG: sanitize_card_config(value)})
            errors[CONF_CARD_CONFIG] = "invalid_card_config"
        current = self.config_entry.options.get(CONF_CARD_CONFIG) or {}
        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_CARD_CONFIG, description={"suggested_value": current}
                ): selector.ObjectSelector()
            }
        )
        return self.async_show_form(
            step_id="card_config", data_schema=schema, errors=errors
        )

    async def async_step_debug(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self._save(
                {
                    CONF_DEBUG_MQTT_MSG: bool(user_input[CONF_DEBUG_MQTT_MSG]),
                    CONF_DEBUG_API_CALLS: bool(user_input[CONF_DEBUG_API_CALLS]),
                }
            )
        options = self.config_entry.options
        legacy = bool(options.get(CONF_DEBUG_DEPRECATED, False))
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_DEBUG_MQTT_MSG,
                    default=bool(options.get(CONF_DEBUG_MQTT_MSG, legacy)),
                ): bool,
                vol.Required(
                    CONF_DEBUG_API_CALLS,
                    default=bool(options.get(CONF_DEBUG_API_CALLS, legacy)),
                ): bool,
            }
        )
        return self.async_show_form(step_id="debug", data_schema=schema)
