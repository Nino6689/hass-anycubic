"""The cloud half: one Anycubic account per config entry.

:class:`CloudAccount` signs in (PROTOCOL A §2.6.5 with the seven rules of
§5.3), keeps the token store (COMPAT §6), polls the cloud at most every 60 s
with back-off (BEHAVIOUR §5.1), watches the pasted token's expiry (§5.6) and
owns the cloud MQTT link (:class:`CloudMqtt`, §5.2). Only a credentials
verdict from the cloud leads to re-authentication; a rate limit, an outage,
an unreadable answer or a printer removed from the account never does
(PROTOCOL A §4.4).
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Mapping
from dataclasses import dataclass
import logging
import time
from typing import TYPE_CHECKING, Any, Final

from anycubic_cloud_client import (
    AnycubicCloudClient,
    AnycubicCloudError,
    AuthMode,
    CloudFile,
    CloudMessage,
    CloudMqttClient,
    CredentialsRejectedError,
    MqttError,
    PrinterDetail,
    PrinterRemovedError,
    Region,
    ServiceUnavailableError,
    TokenState,
    UnexpectedResponseError,
    decode_claims,
    store_is_stale,
)
from homeassistant.core import CoreState, HomeAssistant, callback
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    ConfigEntryNotReady,
    HomeAssistantError,
)
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import UpdateFailed
from homeassistant.util.hass_dict import HassKey

from .const import (
    CAPABILITY_POLL_BUDGET,
    CLOUD_POLL_AFTER_CONTROL,
    CLOUD_POLL_FAILURES_BEFORE_PAUSE,
    CLOUD_POLL_INTERVAL,
    CLOUD_POLL_PAUSE,
    CLOUD_SETUP_ATTEMPTS,
    CLOUD_SETUP_RETRY_DELAY,
    CONF_DEBUG_API_CALLS,
    CONF_DEBUG_DEPRECATED,
    CONF_DEBUG_MQTT_MSG,
    CONF_MQTT_CONNECT_MODE,
    CONF_REGION,
    CONF_USER_AUTH_MODE,
    CONF_USER_DEVICE_ID,
    CONF_USER_TOKEN,
    DEFAULT_MQTT_CONNECT_MODE,
    DOMAIN,
    MQTT_ACTION_HOLD,
    MQTT_CAPABILITY_DELAY,
    MQTT_IDLE_RELEASE,
    MQTT_MODE_ALWAYS,
    MQTT_MODE_NEVER,
    MQTT_MODE_ONLINE,
    MQTT_MODE_PRINTING,
    MQTT_MODE_PRINTING_DRYING,
    MQTT_REFRESH_MIN_INTERVAL,
    MQTT_REFRESH_PAUSE,
    MQTT_WAKE_SETTLE,
    MQTT_WAKE_TIMEOUT,
    STORE_TOKENS,
    STORE_TOKENS_LEGACY,
    STORE_VERSION,
    TOKEN_EXPIRY_WARNING_DAYS,
)

if TYPE_CHECKING:
    from anycubic_cloud_client import Account, CloudSecrets

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator, AnycubicRuntime
    from .model import Printer

_LOGGER = logging.getLogger(__name__)

ISSUE_TOKEN_EXPIRING: Final = "token_expiring"  # noqa: S105 - an issue id

# The server's rate-limit message on the token exchange (PROTOCOL A §4.3). A
# refusal carrying it is transient, never a credentials verdict (acceptance
# L2). anycubic-cloud-client 0.1.0 round 2 raises ServiceUnavailableError
# for it; this also covers a build that still reports it as a refusal.
RATE_LIMIT_MESSAGE: Final = "请求过于频繁"

# Where the repair's links point. The "token tools" are not named in the
# specification (E2-Q3 in docs/QUESTIONS.md): the README's token section
# stands in for all three until they are.
HELP_URL: Final = "https://github.com/Nino6689/hass-anycubic#getting-a-token"

DATA_SIGN_IN: HassKey[dict[str, SignInHandoff]] = HassKey(f"{DOMAIN}_sign_in")


@dataclass(frozen=True, slots=True)
class SignInHandoff:
    """Tokens a config-flow sign-in derived from a pasted token.

    The entry set up (or reloaded) right after the flow reuses them, so the
    access token is not exchanged a second time within seconds (acceptance
    L2: the cloud rate-limits that). Kept in memory only, keyed by the pasted
    token, and taken once.
    """

    tokens: TokenState


@callback
def async_hand_off_sign_in(hass: HomeAssistant, token: str, tokens: TokenState) -> None:
    hass.data.setdefault(DATA_SIGN_IN, {})[token] = SignInHandoff(tokens)


def is_rate_limited(err: CredentialsRejectedError) -> bool:
    return bool(err.server_message and RATE_LIMIT_MESSAGE in err.server_message)


def error_text(err: BaseException) -> str:
    """``<error type>: <message>`` for logs and the MQTT ``last_error``."""
    return f"{type(err).__name__}: {err}"


# ---------------------------------------------------------------------------
# Token store (COMPAT §6, PROTOCOL A §2.10 and §5.3)
# ---------------------------------------------------------------------------


class TokenStore:
    """The entry's cloud session: ``anycubic_cloud.<entry id>``.

    The pasted token on the entry is authoritative; this is a cache of what
    was derived from it (rule 1). The library exports only the four token
    keys, never Anycubic's app credentials: 2.x's app keys are dropped on
    the first save (E2-Q8 in docs/QUESTIONS.md).
    """

    def __init__(self, hass: HomeAssistant, entry_id: str) -> None:
        self._store: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{STORE_TOKENS}.{entry_id}"
        )
        self._legacy: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, STORE_TOKENS_LEGACY
        )

    async def async_load(self) -> dict[str, Any] | None:
        """The per-entry store; when empty, the legacy one, copied (rule 2)."""
        data = await self._store.async_load()
        if isinstance(data, dict) and data:
            return data
        legacy = await self._legacy.async_load()
        if isinstance(legacy, dict) and legacy:
            await self._store.async_save(dict(legacy))
            return legacy
        return None

    async def async_save(self, data: Mapping[str, Any]) -> None:
        await self._store.async_save(dict(data))

    async def async_remove(self) -> None:
        await self._store.async_remove()


async def async_delete_token_store(hass: HomeAssistant, entry_id: str) -> None:
    """Forget a session: a new paste must never be overwritten by it (rule 4)."""
    await TokenStore(hass, entry_id).async_remove()


# ---------------------------------------------------------------------------
# The account
# ---------------------------------------------------------------------------


class CloudAccount:
    """One entry's Anycubic account: sign-in, polling and the MQTT link."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: AnycubicConfigEntry,
        runtime: AnycubicRuntime,
        secrets: CloudSecrets,
    ) -> None:
        self.hass = hass
        self.entry = entry
        self.runtime = runtime
        self.secrets = secrets
        self.session = async_get_clientsession(hass)
        self.tokens = TokenStore(hass, entry.entry_id)
        self.client: AnycubicCloudClient | None = None
        self.account: Account | None = None
        self.mqtt = CloudMqtt(self)
        self.cloud_files: tuple[CloudFile, ...] | None = None
        self._lock = asyncio.Lock()
        self._next_due: float | None = None
        self._failures = 0
        self._error: UpdateFailed | None = None
        self._outage_logged = False
        self._poll_count = 0
        self._clock: Callable[[], float] = time.monotonic

    # -- entry facts ----------------------------------------------------------

    @property
    def token(self) -> str:
        return str(self.entry.data.get(CONF_USER_TOKEN) or "")

    @property
    def auth_mode(self) -> AuthMode:
        return AuthMode.resolve(self.entry.data.get(CONF_USER_AUTH_MODE))

    @property
    def region(self) -> Region:
        return Region.resolve(self.entry.data.get(CONF_REGION))

    @property
    def device_id(self) -> str | None:
        value = self.entry.data.get(CONF_USER_DEVICE_ID)
        return str(value) if value else None

    @property
    def debug_api_calls(self) -> bool:
        options = self.entry.options
        return bool(
            options.get(CONF_DEBUG_API_CALLS, options.get(CONF_DEBUG_DEPRECATED))
        )

    @property
    def last_poll_ok(self) -> bool:
        return self._error is None

    @property
    def last_error(self) -> UpdateFailed | None:
        return self._error

    def _build_client(
        self, store: Mapping[str, Any] | None, mode: AuthMode | None = None
    ) -> AnycubicCloudClient:
        return AnycubicCloudClient.from_entry(
            self.session,
            self.secrets,
            token=self.token,
            auth_mode=mode if mode is not None else self.auth_mode,
            region=self.region,
            device_id=self.device_id,
            store=store,
            debug_api_calls=self.debug_api_calls,
        )

    def _client_mode(self, store: Mapping[str, Any] | None) -> AuthMode:
        """The mode to build the client with.

        2.x saved the mode it *tried* (3) on the entry and the web fallback's
        mode (1) in the store when a web token was pasted as a slicer token
        (PROTOCOL A §2.8). Such entries exist and must load: they are built
        as web clients, which is what they are (no cloud MQTT).
        """
        mode = self.auth_mode
        if (
            store is not None
            and mode is AuthMode.SLICER
            and AuthMode.resolve(store.get("auth_mode")) is AuthMode.WEB
            and not store.get("auth_access_token")
        ):
            return AuthMode.WEB
        return mode

    # -- setup ------------------------------------------------------------------

    async def async_sign_in(self) -> Account:
        """Sign in for setup (PROTOCOL A §2.6.5, §5.3 rules 1-3, 5 and 7).

        Raises ``ConfigEntryAuthFailed`` only for a credentials verdict and
        ``ConfigEntryNotReady`` for everything else.
        """
        if not self.token:
            raise ConfigEntryAuthFailed(
                translation_domain=DOMAIN, translation_key="no_token"
            )
        handoff = self.hass.data.get(DATA_SIGN_IN, {}).pop(self.token, None)
        store: Mapping[str, Any] | None
        if handoff is not None:
            # Derived from this very token by the flow: not a stale cache.
            store = handoff.tokens.to_store()
            from_store = False
        else:
            store = await self.tokens.async_load()
            if store is not None and store_is_stale(
                store, self.token, self._client_mode(store)
            ):
                # Optional hardening of §5.3: a store written for another
                # pasted token is ignored.
                _LOGGER.debug("Ignoring a token store that belongs to another token")
                store = None
            from_store = store is not None
        client = self._build_client(store, self._client_mode(store))
        attempt = 0
        while True:
            try:
                account = await client.check()
                break
            except CredentialsRejectedError as err:
                if is_rate_limited(err):
                    attempt = await self._async_setup_retry(attempt, err)
                    continue
                if from_store:
                    # Rule 3: retry once with only the entry's token and mode.
                    _LOGGER.debug("Stored session refused; retrying from the entry")
                    client = self._build_client(None)
                    from_store = False
                    continue
                raise ConfigEntryAuthFailed(
                    translation_domain=DOMAIN, translation_key="token_rejected"
                ) from err
            except ServiceUnavailableError as err:
                attempt = await self._async_setup_retry(attempt, err)
            except UnexpectedResponseError as err:
                raise ConfigEntryNotReady(
                    translation_domain=DOMAIN, translation_key="cloud_read_error"
                ) from err
            except AnycubicCloudError as err:
                raise ConfigEntryNotReady(
                    translation_domain=DOMAIN,
                    translation_key="cloud_unavailable",
                    translation_placeholders={"error": str(err)},
                ) from err
        self.client = client
        self.account = account
        # Rule 5: saved after every successful setup.
        await self.async_save_tokens()
        self.update_expiry_issue()
        return account

    async def _async_setup_retry(self, attempt: int, err: Exception) -> int:
        """Transient answers at setup: 3 retries 10 s apart (BEHAVIOUR §5.7).

        After them the entry is *not ready* and Home Assistant keeps retrying;
        the specification's terminal error is not used (E2-Q2 in
        docs/QUESTIONS.md: a cloud outage at start-up must not leave the entry
        failed for good).
        """
        attempt += 1
        if attempt >= CLOUD_SETUP_ATTEMPTS:
            raise ConfigEntryNotReady(
                translation_domain=DOMAIN,
                translation_key="cloud_unavailable",
                translation_placeholders={"error": str(err)},
            ) from err
        _LOGGER.debug("Anycubic cloud not answering at setup (%s); retrying", err)
        await asyncio.sleep(CLOUD_SETUP_RETRY_DELAY)
        return attempt

    async def async_save_tokens(self) -> None:
        client = self.client
        if client is None:
            return
        await self.tokens.async_save(client.export_token_store())
        client.mark_tokens_saved()

    async def async_fetch_printer(self, printer_id: int) -> PrinterDetail:
        assert self.client is not None
        return await self.client.get_printer(printer_id)

    # -- expiry repair (BEHAVIOUR §5.6) ------------------------------------------

    @callback
    def update_expiry_issue(self) -> None:
        """Create, refresh or delete ``token_expiring_<entry id>``."""
        issue_id = f"{ISSUE_TOKEN_EXPIRING}_{self.entry.entry_id}"
        claims = decode_claims(self.token)
        left = claims.seconds_left() if claims is not None else None
        if left is None or left > TOKEN_EXPIRY_WARNING_DAYS * 86400:
            ir.async_delete_issue(self.hass, DOMAIN, issue_id)
            return
        days = max(0, int(left // 86400))
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            issue_id,
            is_fixable=False,
            is_persistent=False,
            severity=ir.IssueSeverity.WARNING,
            learn_more_url=HELP_URL,
            translation_key=ISSUE_TOKEN_EXPIRING,
            translation_placeholders={
                "days": str(days),
                "name": self.entry.title,
                "reauth_url": (
                    "https://my.home-assistant.io/redirect/integration/"
                    f"?domain={DOMAIN}"
                ),
                "tool_macos": HELP_URL,
                "tool_windows": HELP_URL,
                "tool_browser": HELP_URL,
            },
        )

    # -- polling (BEHAVIOUR §5.1) ------------------------------------------------

    @callback
    def poll_soon(self) -> None:
        """A control was used: the next refresh polls the cloud at once."""
        self._next_due = None

    async def async_poll(self, caller: AnycubicCoordinator | None = None) -> None:
        """Poll when due; otherwise report the last outcome.

        While the last poll failed, every refresh fails with it, so entities
        stay unavailable until the cloud answers again - never alternating
        with stale values (BEHAVIOUR §5.5).
        """
        if self._next_due is not None and self._clock() < self._next_due:
            if self._error is not None:
                raise self._error
            return
        polls = self._poll_count
        async with self._lock:
            if self._poll_count != polls:
                # Another refresh polled while this one waited.
                if self._error is not None:
                    raise self._error
                return
            try:
                await self._async_poll(caller)
            finally:
                self._poll_count += 1

    async def _async_poll(self, caller: AnycubicCoordinator | None) -> None:
        forced = self._next_due is None and self._poll_count > 0
        try:
            await self._async_poll_once()
        except CredentialsRejectedError as err:
            if not is_rate_limited(err):
                # Re-authentication; until then every refresh fails with it.
                self._next_due = self._clock() + CLOUD_POLL_INTERVAL
                self._error = UpdateFailed(
                    translation_domain=DOMAIN, translation_key="token_rejected"
                )
                raise ConfigEntryAuthFailed(
                    translation_domain=DOMAIN, translation_key="token_rejected"
                ) from err
            self._fail(err, caller)
        except AnycubicCloudError as err:
            self._fail(err, caller)
        except Exception as err:  # never re-auth for an unclassified error (B6)
            _LOGGER.exception("Unexpected error polling the Anycubic cloud")
            self._fail(err, caller)
        else:
            self._succeed(caller, forced)

    def _fail(self, err: Exception, caller: AnycubicCoordinator | None) -> None:
        self._failures += 1
        delay = CLOUD_POLL_INTERVAL
        if self._failures % CLOUD_POLL_FAILURES_BEFORE_PAUSE == 0:
            delay += CLOUD_POLL_PAUSE
        self._next_due = self._clock() + delay
        if not self._outage_logged:
            # Once per outage (§5.5); the coordinator adds its own standard
            # line (E2-Q7 in docs/QUESTIONS.md).
            _LOGGER.warning("The Anycubic cloud is not answering: %s", err)
            self._outage_logged = True
        self._error = UpdateFailed(
            translation_domain=DOMAIN,
            translation_key="cloud_unavailable",
            translation_placeholders={"error": str(err)},
        )
        for coordinator in self.runtime.cloud_coordinators():
            if coordinator is not caller:
                coordinator.async_set_update_error(self._error)
        raise self._error from err

    def _succeed(self, caller: AnycubicCoordinator | None, forced: bool) -> None:
        self._failures = 0
        self._error = None
        if self._outage_logged:
            _LOGGER.info("The Anycubic cloud is answering again")
            self._outage_logged = False
        interval = CLOUD_POLL_AFTER_CONTROL if forced else CLOUD_POLL_INTERVAL
        self._next_due = self._clock() + interval
        for coordinator in self.runtime.cloud_coordinators():
            if coordinator is not caller:
                coordinator.async_cloud_polled()

    async def _async_poll_once(self) -> None:
        """Token check, printer records, one job list, job details, then the
        MQTT check and the capability poll (B §8.2).

        Printers are picked up at setup: one the cloud cannot supply then
        makes the entry *not ready*, and the retried setup picks it up (G23).
        """
        client = self.client
        assert client is not None
        self.account = await client.check()
        if client.tokens_changed:
            await self.async_save_tokens()
        self.update_expiry_issue()
        coordinators = self.runtime.cloud_coordinators()
        live: list[AnycubicCoordinator] = []
        for coordinator in coordinators:
            try:
                detail = await client.get_printer(coordinator.printer_id)
            except PrinterRemovedError:
                coordinator.cloud_printer_removed()
                continue
            coordinator.apply_cloud_detail(detail)
            live.append(coordinator)
        if live:
            jobs = await client.get_latest_jobs([c.printer_id for c in live])
            for coordinator in live:
                job = jobs.get(coordinator.printer_id)
                job_detail = None
                if job is not None and job.id is not None:
                    job_detail = await client.get_job_detail(job.id)
                coordinator.apply_cloud_job(job, job_detail)
        await self.mqtt.async_check()
        await self.mqtt.async_capability_poll()

    # -- files (BEHAVIOUR §2.5, §4.5) ---------------------------------------------

    async def async_fetch_cloud_files(self) -> None:
        """The account's 10 most recent cloud files (one page, PROTOCOL D §3.2)."""
        assert self.client is not None
        self.cloud_files = tuple(await self.client.list_cloud_files())
        for coordinator in self.runtime.coordinators.values():
            coordinator.async_update_listeners()

    # -- messages ---------------------------------------------------------------

    @callback
    def handle_message(self, message: CloudMessage) -> None:
        for coordinator in self.runtime.coordinators.values():
            if coordinator.printer.identity.key == message.printer_key:
                coordinator.apply_cloud_message(message)
                return

    async def async_shutdown(self) -> None:
        await self.mqtt.async_stop()


# ---------------------------------------------------------------------------
# The cloud MQTT link (BEHAVIOUR §5.2, PROTOCOL C §6)
# ---------------------------------------------------------------------------


class CloudMqtt:
    """When the account's cloud MQTT link is held open, and what it does.

    The library connects, subscribes, parses and reconnects; this class
    decides when it runs, from ``mqtt_connect_mode``, the manual switch and
    recent actions, and releases it after 15 minutes of idling.
    """

    def __init__(self, account: CloudAccount) -> None:
        self._account = account
        self.link: CloudMqttClient | None = None
        self._connect_task: asyncio.Task[None] | None = None
        self.manual = False
        """``manual_mqtt_connection_enabled``: in memory only (BEHAVIOUR §2.15)."""
        self.last_error: str | None = None
        self._last_action: float | None = None
        self._idle_since: float | None = None
        self._last_refresh: float | None = None
        self._check_lock = asyncio.Lock()
        self._refreshing = False
        self._budget: dict[int, int] = {}
        self._offline: set[int] = set()
        self._unsubs: list[Callable[[], None]] = []
        self._capability_timer: Callable[[], None] | None = None
        self._clock: Callable[[], float] = time.monotonic

    # -- facts ------------------------------------------------------------------

    @property
    def mode(self) -> int:
        value = self._account.entry.options.get(
            CONF_MQTT_CONNECT_MODE, DEFAULT_MQTT_CONNECT_MODE
        )
        try:
            return int(value)
        except (TypeError, ValueError):
            return DEFAULT_MQTT_CONNECT_MODE

    @property
    def supports_login(self) -> bool:
        """Slicer and Android tokens can log in; web tokens never can."""
        client = self._account.client
        return client is not None and client.auth_mode.supports_mqtt

    @property
    def possible(self) -> bool:
        """Every precondition of PROTOCOL C §6.1 holds."""
        client = self._account.client
        account = self._account.account
        return (
            client is not None
            and client.supports_mqtt_login
            and account is not None
            and account.mqtt_identity is not None
            and self.mode != MQTT_MODE_NEVER
        )

    @property
    def active(self) -> bool:
        """A client exists: connected or still connecting (B13)."""
        task = self._connect_task
        if task is not None and not task.done():
            return True
        return self.link is not None and self.link.is_running

    @property
    def connected(self) -> bool:
        return self.link is not None and self.link.is_connected

    def _printers(self) -> list[Printer]:
        return [c.printer for c in self._account.runtime.cloud_coordinators()]

    def _recent_action(self) -> bool:
        last = self._last_action
        return last is not None and self._clock() - last < MQTT_ACTION_HOLD

    def _mode_wants(self) -> bool:
        printers = self._printers()
        mode = self.mode
        if mode == MQTT_MODE_ALWAYS:
            return True
        busy = any(p.work_status == 2 for p in printers)
        if mode == MQTT_MODE_PRINTING:
            return busy
        if mode == MQTT_MODE_PRINTING_DRYING:
            return busy or any(p.is_drying(0) or p.is_drying(1) for p in printers)
        if mode == MQTT_MODE_ONLINE:
            return busy or any(p.is_online for p in printers)
        return False

    def _mode_idle(self) -> bool:
        printers = self._printers()
        mode = self.mode
        idle_printing = not any(
            p.work_status == 2 or p.job_in_progress for p in printers
        )
        if mode == MQTT_MODE_PRINTING:
            return idle_printing
        if mode == MQTT_MODE_PRINTING_DRYING:
            return idle_printing and not any(
                p.is_drying(0) or p.is_drying(1) for p in printers
            )
        if mode == MQTT_MODE_ONLINE:
            return not any(p.is_online or p.work_status == 2 for p in printers)
        return False  # Always, and unknown values: never released for idling

    # -- the check (PROTOCOL C §6.4-§6.6) ------------------------------------------

    async def async_check(self) -> None:
        """Start or release the link as the mode and the reasons say."""
        async with self._check_lock:
            await self._async_check()

    async def _async_check(self) -> None:
        hass = self._account.hass
        if hass.state is not CoreState.running:
            if hass.is_stopping:
                await self._async_stop()
            return  # nothing is started while starting or stopping
        if not self.possible:
            if self.active:
                await self._async_stop()
            return
        if not self.active:
            if self.manual or self._recent_action() or self._mode_wants():
                self._start()
            return
        if self._mode_idle() and not self._recent_action():
            now = self._clock()
            if self._idle_since is None:
                self._idle_since = now
            elif now - self._idle_since > MQTT_IDLE_RELEASE:
                self._idle_since = None
                if not self.manual:
                    _LOGGER.debug("Releasing the idle Anycubic MQTT link")
                    await self._async_stop()
        else:
            self._idle_since = None

    def _start(self) -> None:
        account = self._account
        client = account.client
        assert client is not None
        options = account.entry.options
        if self.link is None:
            self.link = CloudMqttClient(
                client,
                debug_messages=bool(
                    options.get(CONF_DEBUG_MQTT_MSG, options.get(CONF_DEBUG_DEPRECATED))
                ),
            )
            self._unsubs = [
                self.link.add_message_listener(account.handle_message),
                self.link.add_connection_listener(self._handle_connection),
            ]
        self.subscribe_printers()
        self._idle_since = None
        self._connect_task = account.entry.async_create_background_task(
            account.hass, self._async_connect(self.link), "anycubic_cloud mqtt connect"
        )

    def subscribe_printers(self) -> None:
        if (link := self.link) is None:
            return
        for printer in self._printers():
            identity = printer.identity
            if identity.key:
                link.subscribe_printer(identity.key, identity.model_id)

    async def _async_connect(self, link: CloudMqttClient) -> None:
        try:
            await link.connect()
        except MqttError as err:
            # Reported with host and port by the library; kept for the
            # sensor's attribute, and never blocks a later attempt (B12).
            self.last_error = error_text(err)
        except Exception as err:
            self.last_error = error_text(err)
            _LOGGER.exception("Anycubic MQTT connection failed")
        else:
            self.last_error = None
        self._notify()

    @callback
    def _handle_connection(self, connected: bool, error: MqttError | None) -> None:
        if connected:
            self.last_error = None
            # Ask online printers for peripherals and light 10 s later.
            if self._capability_timer is not None:
                self._capability_timer()
            self._capability_timer = async_call_later(
                self._account.hass, MQTT_CAPABILITY_DELAY, self._async_capability_query
            )
        elif error is not None:
            self.last_error = error_text(error)
        self._notify()

    async def _async_capability_query(self, _now: Any = None) -> None:
        self._capability_timer = None
        for printer in self._printers():
            if printer.is_online:
                await self._async_query_capabilities(printer)

    async def _async_query_capabilities(self, printer: Printer) -> None:
        client = self._account.client
        if client is None:
            return
        try:
            await client.query_peripherals(printer.printer_id)
            await client.query_light_status(printer.printer_id)
        except AnycubicCloudError as err:
            _LOGGER.debug("Capability query failed: %s", err)

    async def async_capability_poll(self) -> None:
        """After a poll, while the link is up: ask online printers still
        missing the camera or light answer, at most 3 times each (§3.14)."""
        for printer in self._printers():
            pid = printer.printer_id
            if not printer.is_online:
                self._offline.add(pid)
                continue
            if pid in self._offline:
                self._offline.discard(pid)
                self._budget.pop(pid, None)
            if not self.connected:
                continue
            missing = printer.state.peripherals is None or not printer.has_light
            used = self._budget.get(pid, 0)
            if missing and used < CAPABILITY_POLL_BUDGET:
                self._budget[pid] = used + 1
                await self._async_query_capabilities(printer)

    def _notify(self) -> None:
        for coordinator in self._account.runtime.coordinators.values():
            coordinator.async_update_listeners()

    async def async_stop(self) -> None:
        async with self._check_lock:
            await self._async_stop()

    async def _async_stop(self) -> None:
        task, self._connect_task = self._connect_task, None
        if task is not None and not task.done():
            task.cancel()
        if self._capability_timer is not None:
            self._capability_timer()
            self._capability_timer = None
        link = self.link
        if link is not None:
            await link.disconnect()
        self._notify()

    # -- wake (PROTOCOL C §6.9) ----------------------------------------------------

    async def async_wake(self) -> None:
        """Bring the link up before an order whose result arrives over MQTT.

        The link then counts as needed for 5 minutes. With no MQTT possible
        (web token, *Never connect*) this returns at once and the order is
        sent anyway. Waits on the real link state, at most 10 s.
        """
        if not self.possible:
            return
        self._last_action = self._clock()
        await self.async_check()
        if self.connected:
            return
        task = self._connect_task
        try:
            if task is None or task.done():
                raise TimeoutError
            async with asyncio.timeout(MQTT_WAKE_TIMEOUT):
                await asyncio.shield(task)
            link = self.link
            if link is None or not link.is_connected:
                raise TimeoutError
        except TimeoutError as err:
            raise HomeAssistantError(
                translation_domain=DOMAIN, translation_key="mqtt_connect_timeout"
            ) from err
        await asyncio.sleep(MQTT_WAKE_SETTLE)

    # -- manual switch and refresh button (BEHAVIOUR §2.12, §2.15) -----------------

    async def async_set_manual(self, enabled: bool) -> None:
        self.manual = enabled
        await self.async_check()

    async def async_refresh(self) -> None:
        """Restart the link: at most once per 5 minutes; reconnects only if the
        mode, the manual switch or a recent action calls for it."""
        now = self._clock()
        if self._refreshing or (
            self._last_refresh is not None
            and now - self._last_refresh < MQTT_REFRESH_MIN_INTERVAL
        ):
            return
        self._last_refresh = now
        self._refreshing = True
        try:
            if self.active:
                await self.async_stop()
                await asyncio.sleep(MQTT_REFRESH_PAUSE)
            else:
                self.last_error = None  # discard a failed attempt
            await self.async_check()
        finally:
            self._refreshing = False
