// test/stubs/date-fns.js
var bang = (name) => () => {
  throw new Error(`date-fns stub: ${name} called from the resolver harness`);
};
var intervalToDuration = bang("intervalToDuration");
var formatDuration = bang("formatDuration");
var format = bang("format");
var addSeconds = bang("addSeconds");
var differenceInSeconds = bang("differenceInSeconds");

// src/const.ts
var platform = "anycubic_cloud";

// src/fire_event.ts
var fireEvent = (node, type, evt_detail, evt_options) => {
  const options = evt_options || {};
  const detail = evt_detail === null || evt_detail === void 0 ? {} : evt_detail;
  const event = new Event(type, {
    bubbles: options.bubbles === void 0 ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === void 0 ? true : options.composed
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

// src/types.ts
var CalculatedTimeType = /* @__PURE__ */ ((CalculatedTimeType2) => {
  CalculatedTimeType2["ETA"] = "ETA";
  CalculatedTimeType2["Elapsed"] = "Elapsed";
  CalculatedTimeType2["Remaining"] = "Remaining";
  return CalculatedTimeType2;
})(CalculatedTimeType || {});
var StatTypeGeneral = /* @__PURE__ */ ((StatTypeGeneral2) => {
  StatTypeGeneral2["Status"] = "Status";
  StatTypeGeneral2["PrinterOnline"] = "Online";
  StatTypeGeneral2["Availability"] = "Availability";
  StatTypeGeneral2["ProjectName"] = "Project";
  StatTypeGeneral2["CurrentLayer"] = "Layer";
  return StatTypeGeneral2;
})(StatTypeGeneral || {});
var StatTypeFDM = /* @__PURE__ */ ((StatTypeFDM2) => {
  StatTypeFDM2["HotendCurrent"] = "Hotend";
  StatTypeFDM2["BedCurrent"] = "Bed";
  StatTypeFDM2["HotendTarget"] = "T Hotend";
  StatTypeFDM2["BedTarget"] = "T Bed";
  StatTypeFDM2["DryingStatus"] = "Dry Status";
  StatTypeFDM2["DryingTime"] = "Dry Time";
  StatTypeFDM2["SpeedMode"] = "Speed Mode";
  StatTypeFDM2["FanSpeed"] = "Fan Speed";
  return StatTypeFDM2;
})(StatTypeFDM || {});
var StatTypeACE = /* @__PURE__ */ ((StatTypeACE2) => {
  StatTypeACE2["DryingStatus"] = "Dry Status";
  StatTypeACE2["DryingTime"] = "Dry Time";
  return StatTypeACE2;
})(StatTypeACE || {});
var StatTypeLCD = /* @__PURE__ */ ((StatTypeLCD2) => {
  StatTypeLCD2["OnTime"] = "On Time";
  StatTypeLCD2["OffTime"] = "Off Time";
  StatTypeLCD2["BottomTime"] = "Bottom Time";
  StatTypeLCD2["ModelHeight"] = "Model Height";
  StatTypeLCD2["BottomLayers"] = "Bottom Layers";
  StatTypeLCD2["ZUpHeight"] = "Z Up Height";
  StatTypeLCD2["ZUpSpeed"] = "Z Up Speed";
  StatTypeLCD2["ZDownSpeed"] = "Z Down Speed";
  return StatTypeLCD2;
})(StatTypeLCD || {});
var PrinterCardStatType = {
  ...CalculatedTimeType,
  ...StatTypeGeneral,
  ...StatTypeFDM,
  ...StatTypeACE,
  ...StatTypeLCD
};
var AnycubicMaterialType = /* @__PURE__ */ ((AnycubicMaterialType2) => {
  AnycubicMaterialType2["PLA"] = "PLA";
  AnycubicMaterialType2["PETG"] = "PETG";
  AnycubicMaterialType2["ABS"] = "ABS";
  AnycubicMaterialType2["PACF"] = "PACF";
  AnycubicMaterialType2["PC"] = "PC";
  AnycubicMaterialType2["ASA"] = "ASA";
  AnycubicMaterialType2["HIPS"] = "HIPS";
  AnycubicMaterialType2["PA"] = "PA";
  AnycubicMaterialType2["PLA_SE"] = "PLA_SE";
  return AnycubicMaterialType2;
})(AnycubicMaterialType || {});

// src/helpers.ts
var stylePxKeys = ["width", "height", "left", "top"];
var UNKNOWN_VALUE = "\u2014";
function updateElementStyleWithObject(el, updateObj) {
  Object.keys(updateObj).forEach((key) => {
    if (stylePxKeys.includes(key) && !isNaN(updateObj[key])) {
      updateObj[key] = updateObj[key].toString() + "px";
    }
  });
  if (el) {
    Object.assign(el.style, updateObj);
  }
}
function createEmptyEntity(entityParams) {
  return {
    state: entityParams.state,
    attributes: entityParams.attributes,
    entity_id: "invalid_domain.invalid_entity",
    last_changed: "",
    last_updated: "",
    context: {
      id: "",
      parent_id: null,
      user_id: null
    }
  };
}
function numberFromString(str) {
  const matches = str.match(/\d+/);
  return Number(matches ? matches[0] : -1);
}
function toTitleCase(str) {
  return str.toLowerCase().split(" ").map((word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}
function buildImageUrlFromEntity(entityState) {
  const token = entityState.attributes.access_token;
  return `${window.location.origin}/api/image_proxy/${entityState.entity_id}?token=${token}`;
}
function buildCameraUrlFromEntity(entityState) {
  const token = entityState.attributes.access_token;
  return `${window.location.origin}/api/camera_proxy_stream/${entityState.entity_id}?token=${token}`;
}
function prettyFilename(str) {
  const splitI = str.indexOf("-0.");
  const splitName = splitI > 0 ? [str.slice(0, splitI), str.slice(splitI + 1)] : [str];
  const chunksFirst = splitName[0].match(/.{1,10}/g);
  const joinFirst = chunksFirst ? chunksFirst.join("\n") : splitName[0];
  return splitName.length > 1 ? joinFirst + "-" + splitName.slice(1)[0] : joinFirst;
}
function getEntityState(hass, entityInfo) {
  return entityInfo ? hass.states[entityInfo.entity_id] : void 0;
}
function getEntityStateFloat(hass, entityInfo) {
  const entityState = getEntityState(hass, entityInfo);
  const stateFloat = entityState ? parseFloat(entityState.state) : 0;
  return !isNaN(stateFloat) ? stateFloat : 0;
}
function getEntityStateString(hass, entityInfo) {
  const entityState = getEntityState(hass, entityInfo);
  return entityState ? String(entityState.state) : "";
}
function getEntityStateBinary(hass, entityInfo, onValue, offValue) {
  const entityState = getEntityStateString(hass, entityInfo);
  return entityState === "on" ? onValue : offValue;
}
function getPrinterDevices(hass) {
  const ownedDeviceIDs = /* @__PURE__ */ new Set();
  for (const key in hass.entities) {
    const ent = hass.entities[key];
    if (ent.platform === platform && ent.device_id) {
      ownedDeviceIDs.add(ent.device_id);
    }
  }
  const printers = {};
  for (const key in hass.devices) {
    const dev = hass.devices[key];
    if (dev.manufacturer === "Anycubic" && !dev.via_device_id && ownedDeviceIDs.has(dev.id)) {
      printers[dev.id] = dev;
    }
  }
  return printers;
}
function getEntityByKey(entities, translationKey) {
  for (const key in entities) {
    if (entities[key].translation_key === translationKey) {
      return entities[key];
    }
  }
  return void 0;
}
function getEntityIdByKey(entities, translationKey) {
  return getEntityByKey(entities, translationKey)?.entity_id;
}
function getStateObjByKey(hass, entities, translationKey) {
  const entityId = getEntityIdByKey(entities, translationKey);
  return entityId ? hass.states[entityId] : void 0;
}
function getStateFloatByKey(hass, entities, translationKey) {
  const stateObj = getStateObjByKey(hass, entities, translationKey);
  if (!stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown") {
    return void 0;
  }
  const asFloat = parseFloat(stateObj.state);
  return isNaN(asFloat) ? void 0 : asFloat;
}
function getPrinterCameras(hass, entities) {
  const cameras = [];
  for (const key in entities) {
    if (!key.startsWith("camera.")) {
      continue;
    }
    const stateObj = hass.states[key];
    cameras.push({
      entity_id: key,
      // By the integration's own key first: on a German install the id ends
      // in "_cloud_kamera", on a Dutch one "_cloudcamera", and neither ends
      // with the English text. Mistaking the Agora WebRTC camera for the
      // local stream breaks both of them.
      isCloud: entities[key].translation_key === "cloud_camera" || key.endsWith("cloud_camera"),
      available: typeof stateObj !== "undefined" && stateObj.state !== "unavailable"
    });
  }
  return cameras.sort((a, b) => Number(a.isCloud) - Number(b.isCloud));
}
function selectPrinterCamera(cameras, configuredEntityId) {
  if (configuredEntityId) {
    return cameras.find((c) => c.entity_id === configuredEntityId) ?? {
      entity_id: configuredEntityId,
      isCloud: configuredEntityId.endsWith("cloud_camera"),
      available: true
    };
  }
  return cameras.find((c) => c.available) ?? cameras[0];
}
function getPrinterEntities(hass, deviceID) {
  const entities = {};
  if (deviceID) {
    const deviceIDs = /* @__PURE__ */ new Set([deviceID]);
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
var KEY_ALIASES = {
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
  ace_firmware: "multi_color_box_fw_version"
};
function matchByKeyOrSuffix(entities, match_domain, match_suffix, strictPrefix) {
  let keyHit;
  let suffixHit;
  for (const key in entities) {
    const ent = entities[key];
    const splitID = key.split(".");
    if (splitID[0] !== match_domain) {
      continue;
    }
    const idPart = splitID[1];
    if (ent.translation_key === match_suffix || ent.translation_key === KEY_ALIASES[match_suffix]) {
      if (!strictPrefix || idPart.startsWith(strictPrefix)) {
        return ent;
      }
      keyHit = keyHit ?? ent;
      continue;
    }
    if (!suffixHit) {
      const matched = strictPrefix ? idPart.split(strictPrefix)[1] === match_suffix : idPart.endsWith(match_suffix);
      if (matched) {
        suffixHit = ent;
      }
    }
  }
  return keyHit ?? suffixHit;
}
function getMatchingEntity(entities, match_domain, match_suffix) {
  return matchByKeyOrSuffix(entities, match_domain, match_suffix);
}
function getStrictMatchingEntity(entities, printerEntityIdPart, match_domain, match_suffix) {
  return matchByKeyOrSuffix(
    entities,
    match_domain,
    match_suffix,
    printerEntityIdPart || void 0
  );
}
function getPrinterEntityIdPart(entities) {
  let common;
  for (const key in entities) {
    const idPart = key.split(".")[1];
    if (common === void 0) {
      common = idPart;
      continue;
    }
    let i = 0;
    while (i < common.length && i < idPart.length && common[i] === idPart[i]) {
      i++;
    }
    common = common.slice(0, i);
    if (common === "") {
      return void 0;
    }
  }
  if (!common) {
    return void 0;
  }
  const lastUnderscore = common.lastIndexOf("_");
  if (lastUnderscore <= 0) {
    return void 0;
  }
  return common.slice(0, lastUnderscore + 1);
}
function getPrinterSwitchStateObj(hass, entities, printerEntityIdPart, suffix) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "switch",
    suffix
  );
  const stateObj = getEntityState(hass, entInfo);
  return stateObj;
}
function getPrinterSwitchState(hass, entities, printerEntityIdPart, suffix, onValue = true, offValue = false) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "switch",
    suffix
  );
  return entInfo ? getEntityStateBinary(hass, entInfo, onValue, offValue) : void 0;
}
function getPrinterButtonStateObj(hass, entities, printerEntityIdPart, suffix, defaultState = "unavailable", defaultAttributes = {}) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "button",
    suffix
  );
  const stateObj = getEntityState(hass, entInfo);
  return stateObj || createEmptyEntity({
    state: String(defaultState),
    attributes: defaultAttributes
  });
}
function getPrinterDryingButtonStateObj(hass, entities, printerEntityIdPart, suffix) {
  return getPrinterButtonStateObj(
    hass,
    entities,
    printerEntityIdPart,
    suffix,
    "unavailable",
    { duration: 0, temperature: 0 }
  );
}
function isPrinterButtonStateAvailable(stateObj) {
  return !["unavailable"].includes(stateObj.state);
}
function getPrinterImageStateUrl(hass, entities, printerEntityIdPart, suffix) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "image",
    suffix
  );
  const stateObj = getEntityState(hass, entInfo);
  return stateObj ? buildImageUrlFromEntity(stateObj) : void 0;
}
function getPrinterSensorStateObj(hass, entities, printerEntityIdPart, suffix, defaultState = "unavailable", defaultAttributes = {}) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "sensor",
    suffix
  );
  const stateObj = getEntityState(hass, entInfo);
  return stateObj || createEmptyEntity({
    state: String(defaultState),
    attributes: defaultAttributes
  });
}
function getPrinterSensorStateString(hass, entities, printerEntityIdPart, suffix, titleCase = false) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "sensor",
    suffix
  );
  if (entInfo) {
    const str = getEntityStateString(hass, entInfo);
    if (titleCase) {
      return toTitleCase(str);
    } else {
      return str;
    }
  } else {
    return void 0;
  }
}
function getPrinterSensorStateFloat(hass, entities, printerEntityIdPart, suffix) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "sensor",
    suffix
  );
  return entInfo ? getEntityStateFloat(hass, entInfo) : void 0;
}
function getPrinterBinarySensorState(hass, entities, printerEntityIdPart, suffix, onValue, offValue, undefValue = void 0) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "binary_sensor",
    suffix
  );
  return entInfo ? getEntityStateBinary(hass, entInfo, onValue, offValue) : undefValue;
}
function getPrinterUpdateEntityState(hass, entities, printerEntityIdPart, suffix) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "update",
    suffix
  );
  if (entInfo) {
    return getEntityStateBinary(
      hass,
      entInfo,
      "Update Available",
      "Up To Date"
    );
  } else {
    return void 0;
  }
}
function getPrinterSupportsMQTT(hass, entities, printerEntityIdPart) {
  const entInfo = getStrictMatchingEntity(
    entities,
    printerEntityIdPart,
    "binary_sensor",
    "mqtt_connection_active"
  );
  const stateObj = getEntityState(hass, entInfo);
  return stateObj ? !!stateObj.attributes.supports_mqtt_login : false;
}
function isFDMPrinter(hass, entities, printerEntityIdPart) {
  return getPrinterSensorStateObj(
    hass,
    entities,
    printerEntityIdPart,
    "current_status"
  ).attributes.material_type === "Filament";
}
function isLCDPrinter(hass, entities, printerEntityIdPart) {
  return getPrinterSensorStateObj(
    hass,
    entities,
    printerEntityIdPart,
    "current_status"
  ).attributes.material_type === "Resin";
}
function getFileListLocalFilesEntity(entities) {
  return getMatchingEntity(entities, "sensor", "file_list_local");
}
function getFileListLocalRefreshEntity(entities) {
  return getMatchingEntity(entities, "button", "request_file_list_local");
}
function getFileListUdiskFilesEntity(entities) {
  return getMatchingEntity(entities, "sensor", "file_list_udisk");
}
function getFileListUdiskRefreshEntity(entities) {
  return getMatchingEntity(entities, "button", "request_file_list_udisk");
}
function getFileListCloudFilesEntity(entities) {
  return getMatchingEntity(entities, "sensor", "file_list_cloud");
}
function getFileListCloudRefreshEntity(entities) {
  return getMatchingEntity(entities, "button", "request_file_list_cloud");
}
function getPrinterDevID(route) {
  const pathParts = route.path.split("/");
  return pathParts.length > 1 ? pathParts[1] : void 0;
}
function getSelectedPrinter(deviceList, deviceID) {
  return deviceList && deviceID ? deviceList[deviceID] : void 0;
}
function getPrinterMAC(printer) {
  return printer && printer.connections.length > 0 && printer.connections[0].length > 1 ? printer.connections[0][1] : null;
}
function getPrinterID(printer) {
  return printer ? printer.serial_number : void 0;
}
function getPage(route) {
  const pathParts = route.path.split("/");
  return pathParts.length > 2 ? pathParts[2] : "main";
}
function isPrintStatePrinting(printStateString) {
  return [
    "printing",
    "preheating",
    "paused",
    "downloading",
    "checking"
  ].includes(printStateString);
}
function printStateStatusColor(printStateString) {
  if (printStateString === "preheating" || printStateString === "busy") {
    return "#ffc107";
  } else if (isPrintStatePrinting(printStateString)) {
    return "#4caf50";
  } else if (printStateString === "unknown") {
    return "#f44336";
  } else if (printStateString === "operational" || printStateString === "finished" || // A printer sitting idle and reachable is a healthy state, not a fault.
  // Over a local connection this is all we get, since the job sensors are
  // reported by the cloud.
  printStateString === "available" || printStateString === "idle" || printStateString === "free") {
    return "#00bcd4";
  } else {
    return "#f44336";
  }
}
var navigateToPrinter = (node, printerID, replace = false) => {
  const prefix = node.route.prefix;
  const endpoint = printerID ? `${printerID}/main` : "";
  const url = `${prefix}/${endpoint}`;
  if (replace) {
    history.replaceState(null, "", url);
  } else {
    history.pushState(null, "", url);
  }
  fireEvent(window, "location-changed", {
    replace
  });
};
var navigateToPage = (node, path, replace = false) => {
  const prefix = node.route.prefix;
  const printerID = getPrinterDevID(node.route);
  const endpoint = printerID ? `${printerID}/${path}` : "";
  const url = `${prefix}/${endpoint}`;
  if (replace) {
    history.replaceState(null, "", url);
  } else {
    history.pushState(null, "", url);
  }
  fireEvent(window, "location-changed", {
    replace
  });
};
function milliSecondsToDuration(milliSeconds) {
  const epoch = /* @__PURE__ */ new Date(0);
  const secondsAfterEpoch = new Date(milliSeconds);
  return intervalToDuration({
    start: epoch,
    end: secondsAfterEpoch
  });
}
function secondsToDuration(seconds) {
  return milliSecondsToDuration(seconds * 1e3);
}
var formatDuration2 = (time, round) => {
  if (time !== 0 && (!time || isNaN(time))) {
    return UNKNOWN_VALUE;
  }
  const dur = secondsToDuration(
    round ? Math.ceil(Number(time) / 60) * 60 : Number(time)
  );
  const parts = [];
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
var formatFutureTime = (futureSeconds, round, use_24hr) => {
  if (futureSeconds !== 0 && (!futureSeconds || isNaN(futureSeconds))) {
    return UNKNOWN_VALUE;
  }
  const fmtSeconds = round ? "" : ":ss";
  const fmtString = use_24hr ? `HH:mm${fmtSeconds}` : `h:mm${fmtSeconds} a`;
  const newDate = /* @__PURE__ */ new Date();
  newDate.setSeconds(newDate.getSeconds() + Number(futureSeconds));
  return format(newDate, fmtString);
};
var calculateTimeStat = (time, timeType, round = false, use_24hr = false) => {
  switch (timeType) {
    case "Remaining" /* Remaining */:
      return formatDuration2(time, round);
    case "ETA" /* ETA */:
      return formatFutureTime(time, round, use_24hr);
    case "Elapsed" /* Elapsed */:
      return formatDuration2(time, round);
    default:
      return UNKNOWN_VALUE;
  }
};
function getEntityTotalSeconds(timeEntity, isSeconds = false) {
  let result;
  if (timeEntity.state) {
    if (timeEntity.state.includes(", ")) {
      const [days_string, time_string] = timeEntity.state.split(", ");
      const [hours, minutes, seconds] = time_string.split(":");
      const day_match = days_string.match(/\d+/);
      const days = day_match ? day_match[0] : 0;
      result = +days * 60 * 60 * 24 + +hours * 60 * 60 + +minutes * 60 + +seconds;
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
var temperatureUnitFromEntity = (entity) => {
  switch (entity.attributes.unit_of_measurement) {
    case "\xB0C":
      return "C" /* C */;
    case "\xB0F":
      return "F" /* F */;
    default:
      return "C" /* C */;
  }
};
var temperatureMap = {
  ["C" /* C */]: {
    ["C" /* C */]: (t) => t,
    ["F" /* F */]: (t) => t * 9 / 5 + 32
  },
  ["F" /* F */]: {
    ["C" /* C */]: (t) => (t - 32) * 5 / 9,
    ["F" /* F */]: (t) => t
  }
};
var convertTemperature = (temperature, from, to) => {
  if (!temperatureMap[from] || !temperatureMap[from][to]) {
    return -1;
  }
  return temperatureMap[from][to](temperature);
};
var getEntityTemperature = (temperatureEntity, temperatureUnit, round = false) => {
  const t = parseFloat(temperatureEntity.state);
  if (isNaN(t)) {
    return UNKNOWN_VALUE;
  }
  const u = temperatureUnitFromEntity(temperatureEntity);
  const tc = convertTemperature(t, u, temperatureUnit || u);
  return `${round ? Math.round(tc) : tc.toFixed(2)}\xB0${temperatureUnit || u}`;
};
function getDefaultMonitoredStats() {
  return [
    PrinterCardStatType.Status,
    PrinterCardStatType.ETA,
    PrinterCardStatType.Elapsed,
    PrinterCardStatType.Remaining
  ];
}
function getDefaultFDMMonitoredStats() {
  return [
    ...getDefaultMonitoredStats(),
    PrinterCardStatType.HotendCurrent,
    PrinterCardStatType.BedCurrent,
    PrinterCardStatType.HotendTarget,
    PrinterCardStatType.BedTarget
  ];
}
function getPanelBasicMonitoredStats() {
  return [
    ...getDefaultMonitoredStats(),
    PrinterCardStatType.PrinterOnline,
    PrinterCardStatType.Availability,
    PrinterCardStatType.ProjectName,
    PrinterCardStatType.CurrentLayer
  ];
}
function getPanelFDMMonitoredStats() {
  return [
    ...getDefaultFDMMonitoredStats(),
    PrinterCardStatType.PrinterOnline,
    PrinterCardStatType.Availability,
    PrinterCardStatType.ProjectName,
    PrinterCardStatType.CurrentLayer
  ];
}
function getPanelACEMonitoredStats() {
  return [
    ...getPanelFDMMonitoredStats(),
    PrinterCardStatType.DryingStatus,
    PrinterCardStatType.DryingTime
  ];
}
function getDefaultCardConfig() {
  return {
    vertical: false,
    // Rounded by default. Unrounded renders a nozzle as "215.00°C" -- two
    // decimals the printer never reported, it sends one -- and a six-hour
    // estimate as "5h50m26s". Both are noise on the first screen a new user
    // sees, and anyone who wants the raw precision can switch it back on.
    round: true,
    use_24hr: true,
    temperatureUnit: "C" /* C */,
    monitoredStats: getDefaultMonitoredStats(),
    scaleFactor: 1,
    slotColors: [],
    showSettingsButton: false,
    alwaysShow: false,
    mediaView: "auto" /* Auto */,
    printerArt: "auto" /* Auto */,
    showMoveButtons: false,
    showControls: true,
    sections: ["filament" /* Filament */]
  };
}
function undefinedDefault(value, defaultValue) {
  return typeof value === "undefined" ? defaultValue : value;
}
function speedModesFromStateObj(speedModeState) {
  const speedModeAttr = speedModeState.attributes.available_modes ?? [];
  return speedModeAttr.reduce(
    (modes, mode) => ({ ...modes, [mode.mode]: mode.description }),
    {}
  );
}
function materialTypeFromString(material_type) {
  return material_type && Object.values(AnycubicMaterialType).includes(material_type) ? AnycubicMaterialType[material_type.toUpperCase()] : void 0;
}
export {
  UNKNOWN_VALUE,
  buildCameraUrlFromEntity,
  buildImageUrlFromEntity,
  calculateTimeStat,
  convertTemperature,
  createEmptyEntity,
  formatDuration2 as formatDuration,
  formatFutureTime,
  getDefaultCardConfig,
  getDefaultFDMMonitoredStats,
  getDefaultMonitoredStats,
  getEntityByKey,
  getEntityIdByKey,
  getEntityState,
  getEntityStateBinary,
  getEntityStateFloat,
  getEntityStateString,
  getEntityTemperature,
  getEntityTotalSeconds,
  getFileListCloudFilesEntity,
  getFileListCloudRefreshEntity,
  getFileListLocalFilesEntity,
  getFileListLocalRefreshEntity,
  getFileListUdiskFilesEntity,
  getFileListUdiskRefreshEntity,
  getMatchingEntity,
  getPage,
  getPanelACEMonitoredStats,
  getPanelBasicMonitoredStats,
  getPanelFDMMonitoredStats,
  getPrinterBinarySensorState,
  getPrinterButtonStateObj,
  getPrinterCameras,
  getPrinterDevID,
  getPrinterDevices,
  getPrinterDryingButtonStateObj,
  getPrinterEntities,
  getPrinterEntityIdPart,
  getPrinterID,
  getPrinterImageStateUrl,
  getPrinterMAC,
  getPrinterSensorStateFloat,
  getPrinterSensorStateObj,
  getPrinterSensorStateString,
  getPrinterSupportsMQTT,
  getPrinterSwitchState,
  getPrinterSwitchStateObj,
  getPrinterUpdateEntityState,
  getSelectedPrinter,
  getStateFloatByKey,
  getStateObjByKey,
  getStrictMatchingEntity,
  isFDMPrinter,
  isLCDPrinter,
  isPrintStatePrinting,
  isPrinterButtonStateAvailable,
  materialTypeFromString,
  milliSecondsToDuration,
  navigateToPage,
  navigateToPrinter,
  numberFromString,
  prettyFilename,
  printStateStatusColor,
  secondsToDuration,
  selectPrinterCamera,
  speedModesFromStateObj,
  temperatureUnitFromEntity,
  toTitleCase,
  undefinedDefault,
  updateElementStyleWithObject
};
