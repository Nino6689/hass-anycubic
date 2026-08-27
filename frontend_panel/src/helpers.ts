import {
  Duration as dfnsDuration,
  format as dfnsFormat,
  intervalToDuration as dfnsIntervalToDuration,
} from "date-fns";

import { platform } from "./const";
import { fireEvent } from "./fire_event";
import {
  AnycubicCameraChoice,
  AnycubicCardConfig,
  AnycubicLitNode,
  AnycubicMaterialType,
  AnycubicSpeedMode,
  AnycubicSpeedModeEntity,
  AnycubicSpeedModes,
  CalculatedTimeType,
  CardSectionType,
  HassDevice,
  HassDeviceList,
  HassEmptyEntity,
  HassEntity,
  HassEntityInfo,
  HassEntityInfos,
  HassRoute,
  HomeAssistant,
  MediaViewType,
  PrinterArtType,
  PrinterCardStatType,
  TemperatureUnit,
} from "./types";

const stylePxKeys = ["width", "height", "left", "top"];

/** Shown wherever the printer has not reported a value. An em dash reads as
 *  "nothing to say", where a zero or an error string reads as a measurement. */
export const UNKNOWN_VALUE = "\u2014";

export function updateElementStyleWithObject(
  el: HTMLElement | undefined,
  updateObj: any, // eslint-disable-line
): void {
  Object.keys(updateObj as object).forEach((key) => {
    // eslint-disable-next-line
    if (stylePxKeys.includes(key) && !isNaN(updateObj[key])) {
      // eslint-disable-next-line
      updateObj[key] = (updateObj[key].toString()) + "px";
    }
  });
  if (el) {
    Object.assign(el.style, updateObj);
  }
}

export function createEmptyEntity(entityParams: HassEmptyEntity): HassEntity {
  return {
    state: entityParams.state,
    attributes: entityParams.attributes,
    entity_id: "invalid_domain.invalid_entity",
    last_changed: "",
    last_updated: "",
    context: {
      id: "",
      parent_id: null,
      user_id: null,
    },
  };
}

export function numberFromString(str: string): number {
  const matches = str.match(/\d+/);
  return Number(matches ? matches[0] : -1);
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word: string) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function buildImageUrlFromEntity(entityState: HassEntity): string {
  const token: string = entityState.attributes.access_token as string;
  return `${window.location.origin}/api/image_proxy/${entityState.entity_id}?token=${token}`;
}

export function buildCameraUrlFromEntity(entityState: HassEntity): string {
  const token: string = entityState.attributes.access_token as string;
  return `${window.location.origin}/api/camera_proxy_stream/${entityState.entity_id}?token=${token}`;
}

export function prettyFilename(str: string): string {
  const splitI = str.indexOf("-0.");
  const splitName =
    splitI > 0 ? [str.slice(0, splitI), str.slice(splitI + 1)] : [str];
  const chunksFirst = splitName[0].match(/.{1,10}/g);
  const joinFirst = chunksFirst ? chunksFirst.join("\n") : splitName[0];
  return splitName.length > 1
    ? joinFirst + "-" + splitName.slice(1)[0]
    : joinFirst;
}

export function getEntityState(
  hass: HomeAssistant,
  entityInfo: HassEntityInfo | undefined,
): HassEntity | undefined {
  return entityInfo ? hass.states[entityInfo.entity_id] : undefined;
}

export function getEntityStateFloat(
  hass: HomeAssistant,
  entityInfo: HassEntityInfo | undefined,
): number {
  const entityState = getEntityState(hass, entityInfo);
  const stateFloat = entityState ? parseFloat(entityState.state) : 0;
  return !isNaN(stateFloat) ? stateFloat : 0;
}

export function getEntityStateString(
  hass: HomeAssistant,
  entityInfo: HassEntityInfo | undefined,
): string {
  const entityState = getEntityState(hass, entityInfo);
  return entityState ? String(entityState.state) : "";
}

export function getEntityStateBinary(
  hass: HomeAssistant,
  entityInfo: HassEntityInfo | undefined,
  onValue: string | boolean,
  offValue: string | boolean,
): string | boolean {
  const entityState = getEntityStateString(hass, entityInfo);
  return entityState === "on" ? onValue : offValue;
}

export function getPrinterDevices(hass: HomeAssistant): HassDeviceList {
  // Manufacturer alone is not proof of ownership: a network scanner that spots
  // the printer on the LAN registers its own device with manufacturer
  // "Anycubic" too, and offering that as a printer yields an entirely blank
  // card. Require at least one entity actually provided by this integration.
  const ownedDeviceIDs = new Set<string>();
  for (const key in hass.entities) {
    const ent = hass.entities[key];
    if (ent.platform === platform && ent.device_id) {
      ownedDeviceIDs.add(ent.device_id);
    }
  }

  const printers: HassDeviceList = {};
  for (const key in hass.devices) {
    const dev = hass.devices[key];

    // Printers are top-level devices. Accessories such as the ACE are also
    // manufactured by Anycubic but hang off a printer via via_device_id, and
    // must not be offered as printers to select.
    if (
      dev.manufacturer === "Anycubic" &&
      !dev.via_device_id &&
      ownedDeviceIDs.has(dev.id)
    ) {
      printers[dev.id] = dev;
    }
  }
  return printers;
}

/** Resolve one of the printer's entities by the integration's own key.
 *
 * Preferred over matching on the entity-id suffix: the key is set by the
 * integration and survives a user renaming the entity, whereas a suffix match
 * silently returns nothing the moment somebody edits an entity id.
 */
export function getEntityByKey(
  entities: HassEntityInfos,
  translationKey: string,
): HassEntityInfo | undefined {
  for (const key in entities) {
    if (entities[key].translation_key === translationKey) {
      return entities[key];
    }
  }
  return undefined;
}

/** The entity_id for one of the printer's entities, by integration key. */
export function getEntityIdByKey(
  entities: HassEntityInfos,
  translationKey: string,
): string | undefined {
  return getEntityByKey(entities, translationKey)?.entity_id;
}

/** State object for one of the printer's entities, by integration key. */
export function getStateObjByKey(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  translationKey: string,
): HassEntity | undefined {
  const entityId = getEntityIdByKey(entities, translationKey);
  return entityId ? hass.states[entityId] : undefined;
}

/** Numeric state for one of the printer's entities, or undefined when the
 *  entity is missing, disabled, or has nothing to report. */
export function getStateFloatByKey(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  translationKey: string,
): number | undefined {
  const stateObj = getStateObjByKey(hass, entities, translationKey);
  if (
    !stateObj ||
    stateObj.state === "unavailable" ||
    stateObj.state === "unknown"
  ) {
    return undefined;
  }
  const asFloat = parseFloat(stateObj.state);
  return isNaN(asFloat) ? undefined : asFloat;
}

/** Cameras belonging to this printer, cloud (WebRTC) last.
 *
 * Resolved by domain rather than by the shared entity-id prefix: the camera
 * entities are not always named off the same prefix as the rest of the
 * printer's entities, so prefix matching is not dependable here.
 */
export function getPrinterCameras(
  hass: HomeAssistant,
  entities: HassEntityInfos,
): AnycubicCameraChoice[] {
  const cameras: AnycubicCameraChoice[] = [];
  for (const key in entities) {
    if (!key.startsWith("camera.")) {
      continue;
    }
    const stateObj: HassEntity | undefined = hass.states[key];
    cameras.push({
      entity_id: key,
      // By the integration's own key first: on a German install the id ends
      // in "_cloud_kamera", on a Dutch one "_cloudcamera", and neither ends
      // with the English text. Mistaking the Agora WebRTC camera for the
      // local stream breaks both of them.
      isCloud:
        entities[key].translation_key === "cloud_camera" ||
        key.endsWith("cloud_camera"),
      available:
        typeof stateObj !== "undefined" && stateObj.state !== "unavailable",
    });
  }
  // The local camera streams from the printer itself and can produce stills, so
  // prefer it when both are usable.
  return cameras.sort((a, b) => Number(a.isCloud) - Number(b.isCloud));
}

/** The camera the card should offer, or undefined when there is nothing usable. */
export function selectPrinterCamera(
  cameras: AnycubicCameraChoice[],
  configuredEntityId: string | undefined,
): AnycubicCameraChoice | undefined {
  if (configuredEntityId) {
    return (
      cameras.find((c) => c.entity_id === configuredEntityId) ?? {
        entity_id: configuredEntityId,
        isCloud: configuredEntityId.endsWith("cloud_camera"),
        available: true,
      }
    );
  }
  return cameras.find((c) => c.available) ?? cameras[0];
}

export function getPrinterEntities(
  hass: HomeAssistant,
  deviceID: string | undefined,
): HassEntityInfos {
  const entities: HassEntityInfos = {};
  if (deviceID) {
    // Accessories such as the ACE are separate devices attached to the
    // printer, so their entities (spools, drying, box fan) must be gathered
    // too -- otherwise the card loses everything filament-related.
    const deviceIDs = new Set<string>([deviceID]);
    for (const key in hass.devices) {
      if (hass.devices[key].via_device_id === deviceID) {
        deviceIDs.add(hass.devices[key].id);
      }
    }

    for (const key in hass.entities) {
      const ent = hass.entities[key];

      if (ent.device_id && deviceIDs.has(ent.device_id)) {
        entities[ent.entity_id] = ent;
      }
    }
  }
  return entities;
}

/**
 * Entity-id text is the WRONG identity and it bit twice before this landed:
 * ids slugify from the entity's display name in the server's language at
 * registration time, so a German install never matches an English suffix; and
 * when the ACE moved onto its own device, fresh installs gained an "_ace_pro_"
 * infix that no suffix ever matched -- while every dev machine kept its old
 * ids and kept working. The integration-owned `translation_key` is stable
 * across languages, devices and renames, so it is consulted first; the suffix
 * remains as a fallback for the few lookups whose suffix never matched a key.
 */
/**
 * Lookup names whose entity carries a different translation_key.
 *
 * The names on the left are the frontend's own vocabulary -- they appear in
 * card configs users have saved (monitoredStats) and they match the entity-id
 * suffix of an English install, so they cannot simply be renamed. But eleven
 * of them never matched the integration's translation_key, which means those
 * lookups only ever worked by English id text: on a German or French install
 * the temperatures, fan, drying, preview and firmware rows were blank even
 * with every other fix in place. The matcher consults this table so the old
 * names keep working everywhere, in every language.
 */
const KEY_ALIASES: Record<string, string> = {
  nozzle_temperature: "curr_nozzle_temp",
  hotbed_temperature: "curr_hotbed_temp",
  target_nozzle_temperature: "target_nozzle_temp",
  target_hotbed_temperature: "target_hotbed_temp",
  fan_speed: "fan_speed_pct",
  drying_active: "dry_status_is_drying",
  drying_remaining_time: "dry_status_remaining_time",
  drying_total_duration: "dry_status_total_duration",
  job_preview: "job_image_url",
  printer_firmware: "fw_version",
  ace_firmware: "multi_color_box_fw_version",
};

function matchByKeyOrSuffix(
  entities: HassEntityInfos,
  match_domain: string,
  match_suffix: string,
  strictPrefix?: string,
): HassEntityInfo | undefined {
  let keyHit: HassEntityInfo | undefined;
  let suffixHit: HassEntityInfo | undefined;
  for (const key in entities) {
    const ent = entities[key];
    const splitID = key.split(".");
    if (splitID[0] !== match_domain) {
      continue;
    }
    const idPart = splitID[1];
    if (
      ent.translation_key === match_suffix ||
      ent.translation_key === KEY_ALIASES[match_suffix]
    ) {
      // The prefix is a preference here, never a filter. The sets these
      // lookups run over are already scoped to one printer's devices, so a
      // key match is normally unique -- but if two ever qualify, the one
      // whose id carries the printer's own prefix wins. Filtering instead
      // would resurrect the bug this replaced: a renamed or foreign-language
      // id doesn't carry the expected prefix, and the key match is exactly
      // what still identifies it.
      if (!strictPrefix || idPart.startsWith(strictPrefix)) {
        return ent;
      }
      keyHit = keyHit ?? ent;
      continue;
    }
    if (!suffixHit) {
      const matched = strictPrefix
        ? idPart.split(strictPrefix)[1] === match_suffix
        : idPart.endsWith(match_suffix);
      if (matched) {
        suffixHit = ent;
      }
    }
  }
  return keyHit ?? suffixHit;
}

export function getMatchingEntity(
  entities: HassEntityInfos,
  match_domain: string,
  match_suffix: string,
): HassEntityInfo | undefined {
  return matchByKeyOrSuffix(entities, match_domain, match_suffix);
}

export function getStrictMatchingEntity(
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  match_domain: string,
  match_suffix: string,
): HassEntityInfo | undefined {
  // No bail when the prefix is unknown. It used to return undefined here,
  // which turned one failed derivation into a blank card: on a German or
  // French install nothing ends in "printer_online", the prefix came back
  // undefined, and every lookup in the card and panel died before the
  // translation-key match -- the one identity that still held -- was ever
  // tried (#25).
  return matchByKeyOrSuffix(
    entities,
    match_domain,
    match_suffix,
    printerEntityIdPart || undefined,
  );
}

export function getPrinterEntityIdPart(
  entities: HassEntityInfos,
): string | undefined {
  // The shared id prefix, derived from the ids themselves rather than from
  // any one English suffix. Ids are slug(device name) + slug(entity name in
  // the server's language at registration time): the device half is the
  // cloud's own name and never localized, the entity half is. The old
  // derivation looked for an id ending in "printer_online", which on a
  // German install is "_drucker_online" -- nothing matched, the prefix came
  // back undefined, and with the old bail in getStrictMatchingEntity that
  // blanked the whole card (#25).
  //
  // The longest common prefix of the printer's own ids is language-proof,
  // and it is trimmed back to an underscore so two suffixes that share a
  // first letter cannot leak it forward ("_ace_spulen" and
  // "_aktueller_status" share "a"). The prefix is only ever a preference and
  // a legacy-fallback aid now, so an empty answer -- one renamed entity is
  // enough to collapse the common prefix -- costs nothing: the
  // translation-key match carries every lookup on its own.
  let common: string | undefined;
  for (const key in entities) {
    const idPart = key.split(".")[1];
    if (common === undefined) {
      common = idPart;
      continue;
    }
    let i = 0;
    while (i < common.length && i < idPart.length && common[i] === idPart[i]) {
      i++;
    }
    common = common.slice(0, i);
    if (common === "") {
      return undefined;
    }
  }
  if (!common) {
    return undefined;
  }
  const lastUnderscore = common.lastIndexOf("_");
  if (lastUnderscore <= 0) {
    return undefined;
  }
  return common.slice(0, lastUnderscore + 1);
}

export function getPrinterSwitchStateObj(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
): HassEntity | undefined {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "switch",
    suffix,
  );
  const stateObj = getEntityState(hass, entInfo);
  return stateObj;
}

export function getPrinterSwitchState(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
  onValue: string | boolean = true,
  offValue: string | boolean = false,
): string | boolean | undefined {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "switch",
    suffix,
  );
  return entInfo
    ? getEntityStateBinary(hass, entInfo, onValue, offValue)
    : undefined;
}

export function getPrinterButtonStateObj(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
  defaultState: string | number = "unavailable",
  defaultAttributes: object = {},
): HassEntity {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "button",
    suffix,
  );
  const stateObj = getEntityState(hass, entInfo);
  return (
    stateObj ||
    createEmptyEntity({
      state: String(defaultState),
      attributes: defaultAttributes,
    })
  );
}

export function getPrinterDryingButtonStateObj(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
): HassEntity {
  return getPrinterButtonStateObj(
    hass,
    entities,
    printerEntityIdPart,
    suffix,
    "unavailable",
    { duration: 0, temperature: 0 },
  );
}

export function isPrinterButtonStateAvailable(stateObj: HassEntity): boolean {
  return !["unavailable"].includes(stateObj.state);
}

export function getPrinterImageStateUrl(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
): string | undefined {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "image",
    suffix,
  );
  const stateObj = getEntityState(hass, entInfo);
  return stateObj ? buildImageUrlFromEntity(stateObj) : undefined;
}

export function getPrinterSensorStateObj(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
  defaultState: string | number = "unavailable",
  defaultAttributes: object = {},
): HassEntity {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "sensor",
    suffix,
  );
  const stateObj = getEntityState(hass, entInfo);
  return (
    stateObj ||
    createEmptyEntity({
      state: String(defaultState),
      attributes: defaultAttributes,
    })
  );
}

export function getPrinterSensorStateString(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
  titleCase: boolean = false,
): string | undefined {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "sensor",
    suffix,
  );
  if (entInfo) {
    const str = getEntityStateString(hass, entInfo);
    if (titleCase) {
      return toTitleCase(str);
    } else {
      return str;
    }
  } else {
    return undefined;
  }
}

export function getPrinterSensorStateFloat(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
): number | undefined {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "sensor",
    suffix,
  );
  return entInfo ? getEntityStateFloat(hass, entInfo) : undefined;
}

export function getPrinterBinarySensorState(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
  onValue: string | boolean,
  offValue: string | boolean,
  undefValue: string | boolean | undefined = undefined,
): string | boolean | undefined {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "binary_sensor",
    suffix,
  );
  return entInfo
    ? getEntityStateBinary(hass, entInfo, onValue, offValue)
    : undefValue;
}

export function getPrinterUpdateEntityState(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
  suffix: string,
): string | undefined {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "update",
    suffix,
  );
  if (entInfo) {
    return getEntityStateBinary(
      hass,
      entInfo,
      "Update Available",
      "Up To Date",
    ) as string;
  } else {
    return undefined;
  }
}

export function getPrinterSupportsMQTT(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
): boolean {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "binary_sensor",
    "mqtt_connection_active",
  );
  const stateObj = getEntityState(hass, entInfo);
  return stateObj ? !!stateObj.attributes.supports_mqtt_login : false;
}

export function isFDMPrinter(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
): boolean {
  return (
    getPrinterSensorStateObj(
      hass,
      entities,
      printerEntityIdPart,
      "current_status",
    ).attributes.material_type === "Filament"
  );
}

export function isLCDPrinter(
  hass: HomeAssistant,
  entities: HassEntityInfos,
  printerEntityIdPart: string | undefined,
): boolean {
  return (
    getPrinterSensorStateObj(
      hass,
      entities,
      printerEntityIdPart,
      "current_status",
    ).attributes.material_type === "Resin"
  );
}

export function getFileListLocalFilesEntity(
  entities: HassEntityInfos,
): HassEntityInfo | undefined {
  return getMatchingEntity(entities, "sensor", "file_list_local");
}

export function getFileListLocalRefreshEntity(
  entities: HassEntityInfos,
): HassEntityInfo | undefined {
  return getMatchingEntity(entities, "button", "request_file_list_local");
}

export function getFileListUdiskFilesEntity(
  entities: HassEntityInfos,
): HassEntityInfo | undefined {
  return getMatchingEntity(entities, "sensor", "file_list_udisk");
}

export function getFileListUdiskRefreshEntity(
  entities: HassEntityInfos,
): HassEntityInfo | undefined {
  return getMatchingEntity(entities, "button", "request_file_list_udisk");
}

export function getFileListCloudFilesEntity(
  entities: HassEntityInfos,
): HassEntityInfo | undefined {
  return getMatchingEntity(entities, "sensor", "file_list_cloud");
}

export function getFileListCloudRefreshEntity(
  entities: HassEntityInfos,
): HassEntityInfo | undefined {
  return getMatchingEntity(entities, "button", "request_file_list_cloud");
}

export function getPrinterDevID(route: HassRoute): string | undefined {
  const pathParts = route.path.split("/");
  return pathParts.length > 1 ? pathParts[1] : undefined;
}

export function getSelectedPrinter(
  deviceList: HassDeviceList | undefined,
  deviceID: string | undefined,
): HassDevice | undefined {
  return deviceList && deviceID ? deviceList[deviceID] : undefined;
}

export function getPrinterMAC(printer: HassDevice | undefined): string | null {
  return printer &&
    printer.connections.length > 0 &&
    printer.connections[0].length > 1
    ? printer.connections[0][1]
    : null;
}

export function getPrinterID(
  printer: HassDevice | undefined,
): string | undefined {
  return printer ? printer.serial_number : undefined;
}

export function getPage(route: HassRoute): string {
  const pathParts = route.path.split("/");
  return pathParts.length > 2 ? pathParts[2] : "main";
}

export function isPrintStatePrinting(printStateString: string): boolean {
  return [
    "printing",
    "preheating",
    "paused",
    "downloading",
    "checking",
  ].includes(printStateString);
}

export function printStateStatusColor(printStateString: string): string {
  // "busy" is what a printer reports while it is getting on with something the
  // job sensors cannot describe -- levelling, or any work seen over a local
  // connection. It is activity, not a fault.
  if (printStateString === "preheating" || printStateString === "busy") {
    return "#ffc107";
  } else if (isPrintStatePrinting(printStateString)) {
    return "#4caf50";
  } else if (printStateString === "unknown") {
    return "#f44336";
  } else if (
    printStateString === "operational" ||
    printStateString === "finished" ||
    // A printer sitting idle and reachable is a healthy state, not a fault.
    // Over a local connection this is all we get, since the job sensors are
    // reported by the cloud.
    printStateString === "available" ||
    printStateString === "idle" ||
    printStateString === "free"
  ) {
    return "#00bcd4";
  } else {
    return "#f44336";
  }
}

export const navigateToPrinter = (
  node: AnycubicLitNode,
  printerID: string,
  replace: boolean = false,
): void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const prefix: string = node.route.prefix;
  const endpoint = printerID ? `${printerID}/main` : "";
  const url = `${prefix}/${endpoint}`;
  if (replace) {
    history.replaceState(null, "", url);
  } else {
    history.pushState(null, "", url);
  }
  fireEvent(window, "location-changed", {
    replace,
  });
};

export const navigateToPage = (
  node: AnycubicLitNode,
  path: string,
  replace: boolean = false,
): void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const prefix: string = node.route.prefix;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const printerID = getPrinterDevID(node.route);
  const endpoint = printerID ? `${printerID}/${path}` : "";
  const url = `${prefix}/${endpoint}`;
  if (replace) {
    history.replaceState(null, "", url);
  } else {
    history.pushState(null, "", url);
  }
  fireEvent(window, "location-changed", {
    replace,
  });
};

export function milliSecondsToDuration(milliSeconds: number): dfnsDuration {
  const epoch = new Date(0);
  const secondsAfterEpoch = new Date(milliSeconds);
  return dfnsIntervalToDuration({
    start: epoch,
    end: secondsAfterEpoch,
  });
}

export function secondsToDuration(seconds: number): dfnsDuration {
  return milliSecondsToDuration(seconds * 1e3);
}

export const formatDuration = (
  time: number | string | undefined,
  round: boolean,
): string => {
  if (time !== 0 && (!time || isNaN(time as number))) {
    return UNKNOWN_VALUE;
  }
  const dur: dfnsDuration = secondsToDuration(
    round ? Math.ceil(Number(time) / 60) * 60 : Number(time),
  );

  // Show the two most significant units and stop. Concatenating every
  // non-zero unit produced "1h0s" for exactly one hour -- the minutes dropped
  // out because they were zero, leaving something that reads as 1 hour and 0
  // seconds -- and "5h50m26s", which offers seconds of precision on a
  // six-hour estimate. Dropping every zero unit also meant a duration of zero
  // rendered as the empty string, so a finished print showed a blank stat.
  const parts: string[] = [];
  if (dur.days) {
    parts.push(`${dur.days}d`);
  }
  if (dur.hours && parts.length < 2) {
    parts.push(`${dur.hours}h`);
  }
  if (dur.minutes && parts.length < 2 && !dur.days) {
    parts.push(`${dur.minutes}m`);
  }
  if (dur.seconds && parts.length < 2 && !dur.days && !dur.hours && !round) {
    parts.push(`${dur.seconds}s`);
  }
  if (!parts.length) {
    return round ? "0m" : "0s";
  }

  return parts.join(" ");
};

export const formatFutureTime = (
  futureSeconds: number | string | undefined,
  round: boolean,
  use_24hr: boolean,
): string => {
  if (
    futureSeconds !== 0 &&
    (!futureSeconds || isNaN(futureSeconds as number))
  ) {
    return UNKNOWN_VALUE;
  }
  const fmtSeconds = round ? "" : ":ss";
  const fmtString = use_24hr ? `HH:mm${fmtSeconds}` : `h:mm${fmtSeconds} a`;
  const newDate = new Date();
  newDate.setSeconds(newDate.getSeconds() + Number(futureSeconds));
  // newDate is already the correct absolute instant, so format it in the
  // browser's local timezone. Formatting it in UTC showed the ETA as a UTC
  // wall-clock time for anyone not on UTC.
  return dfnsFormat(newDate, fmtString);
};

export const calculateTimeStat = (
  time: number | string | undefined,
  timeType: CalculatedTimeType,
  round: boolean = false,
  use_24hr: boolean = false,
): string => {
  switch (timeType) {
    case CalculatedTimeType.Remaining:
      return formatDuration(time, round);
    case CalculatedTimeType.ETA:
      return formatFutureTime(time, round, use_24hr);
    case CalculatedTimeType.Elapsed:
      return formatDuration(time, round);
    default:
      return UNKNOWN_VALUE;
  }
};

export function getEntityTotalSeconds(
  timeEntity: HassEntity,
  isSeconds: boolean = false,
): number {
  let result: number;
  if (timeEntity.state) {
    if (timeEntity.state.includes(", ")) {
      const [days_string, time_string] = timeEntity.state.split(", ");
      const [hours, minutes, seconds] = time_string.split(":");
      const day_match = days_string.match(/\d+/);
      const days = day_match ? day_match[0] : 0;
      result =
        +days * 60 * 60 * 24 + +hours * 60 * 60 + +minutes * 60 + +seconds;
    } else if (timeEntity.state.includes(":")) {
      const [hours, minutes, seconds] = timeEntity.state.split(":");
      result = +hours * 60 * 60 + +minutes * 60 + +seconds;
    } else if (isSeconds) {
      const seconds = timeEntity.state;
      result = +seconds;
    } else {
      const minutes = timeEntity.state;
      result = +minutes * 60;
    }
  } else {
    result = 0;
  }
  return result;
}

export const temperatureUnitFromEntity = (
  entity: HassEntity,
): TemperatureUnit => {
  switch (entity.attributes.unit_of_measurement) {
    case "°C":
      return TemperatureUnit.C;
    case "°F":
      return TemperatureUnit.F;
    default:
      return TemperatureUnit.C;
  }
};

const temperatureMap = {
  [TemperatureUnit.C]: {
    [TemperatureUnit.C]: (t: number): number => t,
    [TemperatureUnit.F]: (t: number): number => (t * 9.0) / 5.0 + 32.0,
  },
  [TemperatureUnit.F]: {
    [TemperatureUnit.C]: (t: number): number => ((t - 32.0) * 5.0) / 9.0,
    [TemperatureUnit.F]: (t: number): number => t,
  },
};

export const convertTemperature = (
  temperature: number,
  from: TemperatureUnit,
  to: TemperatureUnit,
): number => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!temperatureMap[from] || !temperatureMap[from][to]) {
    return -1;
  }

  return temperatureMap[from][to](temperature);
};

export const getEntityTemperature = (
  temperatureEntity: HassEntity,
  temperatureUnit: TemperatureUnit | undefined,
  round: boolean = false,
): string => {
  const t: number = parseFloat(temperatureEntity.state);
  // "unavailable" parses to NaN and NaN survives the unit conversion, so an
  // offline printer read "NaN°C" -- worse than no reading, because it looks
  // like a measurement.
  if (isNaN(t)) {
    return UNKNOWN_VALUE;
  }
  const u: TemperatureUnit = temperatureUnitFromEntity(temperatureEntity);
  const tc: number = convertTemperature(t, u, temperatureUnit || u);

  return `${round ? Math.round(tc) : tc.toFixed(2)}°${temperatureUnit || u}`;
};

export function getDefaultMonitoredStats(): PrinterCardStatType[] {
  return [
    PrinterCardStatType.Status,
    PrinterCardStatType.ETA,
    PrinterCardStatType.Elapsed,
    PrinterCardStatType.Remaining,
  ];
}

export function getDefaultFDMMonitoredStats(): PrinterCardStatType[] {
  return [
    ...getDefaultMonitoredStats(),
    PrinterCardStatType.HotendCurrent,
    PrinterCardStatType.BedCurrent,
    PrinterCardStatType.HotendTarget,
    PrinterCardStatType.BedTarget,
  ];
}

export function getPanelBasicMonitoredStats(): PrinterCardStatType[] {
  return [
    ...getDefaultMonitoredStats(),
    PrinterCardStatType.PrinterOnline,
    PrinterCardStatType.Availability,
    PrinterCardStatType.ProjectName,
    PrinterCardStatType.CurrentLayer,
  ];
}

export function getPanelFDMMonitoredStats(): PrinterCardStatType[] {
  return [
    ...getDefaultFDMMonitoredStats(),
    PrinterCardStatType.PrinterOnline,
    PrinterCardStatType.Availability,
    PrinterCardStatType.ProjectName,
    PrinterCardStatType.CurrentLayer,
  ];
}

export function getPanelACEMonitoredStats(): PrinterCardStatType[] {
  return [
    ...getPanelFDMMonitoredStats(),
    PrinterCardStatType.DryingStatus,
    PrinterCardStatType.DryingTime,
  ];
}

export function getDefaultCardConfig(): AnycubicCardConfig {
  return {
    vertical: false,
    // Rounded by default. Unrounded renders a nozzle as "215.00°C" -- two
    // decimals the printer never reported, it sends one -- and a six-hour
    // estimate as "5h50m26s". Both are noise on the first screen a new user
    // sees, and anyone who wants the raw precision can switch it back on.
    round: true,
    use_24hr: true,
    temperatureUnit: TemperatureUnit.C,
    monitoredStats: getDefaultMonitoredStats(),
    scaleFactor: 1,
    slotColors: [],
    showSettingsButton: false,
    alwaysShow: false,
    mediaView: MediaViewType.Auto,
    printerArt: PrinterArtType.Auto,
    showMoveButtons: false,
    showControls: true,
    sections: [CardSectionType.Filament],
  };
}

// eslint-disable-next-line
export function undefinedDefault(value: any, defaultValue: any): any {
  return typeof value === "undefined" ? defaultValue : value;
}

export function speedModesFromStateObj(
  speedModeState: AnycubicSpeedModeEntity,
): AnycubicSpeedModes {
  const speedModeAttr: AnycubicSpeedMode[] =
    (speedModeState.attributes.available_modes as
      | AnycubicSpeedMode[]
      | undefined) ?? [];
  return speedModeAttr.reduce(
    (modes, mode) => ({ ...modes, [mode.mode]: mode.description }),
    {},
  );
}

export function materialTypeFromString(
  material_type?: string,
): AnycubicMaterialType | undefined {
  return material_type &&
    (Object.values(AnycubicMaterialType) as string[]).includes(material_type)
    ? AnycubicMaterialType[material_type.toUpperCase() as AnycubicMaterialType]
    : undefined;
}
