import {
  Connection,
  HassEntityAttributeBase,
  HassServices,
  MessageBase,
  HassEntities as _HassEntities,
  HassEntity as _HassEntity,
} from "home-assistant-js-websocket";
import { TemplateResult, nothing } from "lit";
import { ColorPicker as _ColorPicker } from "./lib/colorpicker/ColorPicker.js";

export type LitTemplateResult = typeof nothing | TemplateResult;

export type ColorPicker = _ColorPicker;

export interface Dictionary<TValue> {
  [id: string]: TValue;
}

export interface ServiceCallRequest {
  domain: string;
  action: string;
  service: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceData?: Record<string, any>;
  target?: {
    entity_id?: string | string[];
    device_id?: string | string[];
    area_id?: string | string[];
  };
}

export interface HassEmptyEntity {
  state: string;
  attributes: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface HassDevice {
  id: string;
  config_entries: string[];
  name: string;
  model?: string;
  sw_version?: string;
  primary_config_entry: string;
  manufacturer: string | null;
  serial_number: string | undefined;
  connections: string[][];
  // Set on child devices (e.g. an ACE attached to a printer).
  via_device_id?: string | null;
}

export interface HassDeviceList {
  [id: string]: HassDevice;
}

export type HassEntities = _HassEntities;
export type HassEntity = _HassEntity;

export type HassEntityInfo = {
  entity_id: string;
  device_id?: string;
  labels?: string[];
  translation_key?: string;
  platform?: string;
  name?: string;
};

export type HassEntityInfos = {
  [entity_id: string]: HassEntityInfo;
};

export interface HomeAssistant {
  connection: Connection;
  language: string;
  panels: {
    [name: string]: {
      component_name: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: { [key: string]: any } | null;
      icon: string | null;
      title: string | null;
      url_path: string;
    };
  };
  config: {
    currency?: string;
    unit_system?: { temperature?: string };
  };
  devices: HassDeviceList;
  entities: HassEntityInfos;
  states: HassEntities;
  services: HassServices;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localize: (key: string, ...args: any[]) => string;
  translationMetadata: {
    fragments: string[];
    translations: {
      [lang: string]: {
        nativeName: string;
        isRTL: boolean;
        fingerprints: { [fragment: string]: string };
      };
    };
  };
  callApi: <T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters?: { [key: string]: any },
  ) => Promise<T>;
  callService: (
    domain: ServiceCallRequest["domain"],
    action: ServiceCallRequest["action"],
    serviceData?: ServiceCallRequest["serviceData"],
    target?: ServiceCallRequest["target"],
  ) => Promise<void>;
  callWS: <T>(msg: MessageBase) => Promise<T>;
}

export interface HassRoute {
  prefix: string;
  path: string;
}

export interface HaTextField {
  name: string;
  value: string;
}

export type HaFormData = string | number | boolean | string[];

export interface HaFormBaseSchema {
  name: string;
  default?: HaFormData;
  required?: boolean;
  description?: {
    suffix?: string;
    suggested_value?: HaFormData;
  };
  context?: Record<string, string>;
  type?: never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selector?: any;
}

export interface AnycubicFileLocal {
  name: string;
  size_mb: number;
}

export interface AnycubicFileCloud extends AnycubicFileLocal {
  id: number;
}

export enum CalculatedTimeType {
  ETA = "ETA",
  Elapsed = "Elapsed",
  Remaining = "Remaining",
}

export enum TemperatureUnit {
  F = "F",
  C = "C",
}

export enum StatTypeGeneral {
  Status = "Status",
  PrinterOnline = "Online",
  Availability = "Availability",
  ProjectName = "Project",
  CurrentLayer = "Layer",
}

export enum StatTypeFDM {
  HotendCurrent = "Hotend",
  BedCurrent = "Bed",
  HotendTarget = "T Hotend",
  BedTarget = "T Bed",
  DryingStatus = "Dry Status",
  DryingTime = "Dry Time",
  SpeedMode = "Speed Mode",
  FanSpeed = "Fan Speed",
}

export enum StatTypeACE {
  DryingStatus = "Dry Status",
  DryingTime = "Dry Time",
}

export enum StatTypeLCD {
  OnTime = "On Time",
  OffTime = "Off Time",
  BottomTime = "Bottom Time",
  ModelHeight = "Model Height",
  BottomLayers = "Bottom Layers",
  ZUpHeight = "Z Up Height",
  ZUpSpeed = "Z Up Speed",
  ZDownSpeed = "Z Down Speed",
}

export const PrinterCardStatType = {
  ...CalculatedTimeType,
  ...StatTypeGeneral,
  ...StatTypeFDM,
  ...StatTypeACE,
  ...StatTypeLCD,
};
export type PrinterCardStatType =
  | CalculatedTimeType
  | StatTypeGeneral
  | StatTypeFDM
  | StatTypeACE
  | StatTypeLCD;

export interface AnimatedPrinterBasicDimension {
  width: number;
  height: number;
}

export interface AnimatedPrinterXYDimension {
  X: number;
  Y: number;
}

export interface AnimatedPrinterLTDimension
  extends AnimatedPrinterBasicDimension {
  left: number;
  top: number;
}

export interface AnimatedPrinterLTWidth {
  width: number;
  left: number;
  top: number;
}

export interface AnimatedPrinterBuildPlateDimension {
  maxWidth: number;
  maxHeight: number;
  verticalOffset: number;
}

export interface AnimatedPrinterAxisConfig
  extends AnimatedPrinterBasicDimension {
  stepper: boolean;
  offsetLeft: number;
  extruder: AnimatedPrinterBasicDimension;
}

export interface AnimatedPrinterConfig {
  top: AnimatedPrinterBasicDimension;
  bottom: AnimatedPrinterBasicDimension;
  left: AnimatedPrinterBasicDimension;
  right: AnimatedPrinterBasicDimension;
  buildplate: AnimatedPrinterBuildPlateDimension;
  xAxis: AnimatedPrinterAxisConfig;
}

export interface AnimatedPrinterDimensions {
  Scalable: AnimatedPrinterBasicDimension;
  Frame: AnimatedPrinterBasicDimension;
  Hole: AnimatedPrinterLTDimension;
  BuildArea: AnimatedPrinterLTDimension;
  BuildPlate: AnimatedPrinterLTWidth;
  XAxis: AnimatedPrinterLTDimension;
  Track: AnimatedPrinterBasicDimension;
  Basis: AnimatedPrinterXYDimension;
  Gantry: AnimatedPrinterLTDimension;
  Nozzle: AnimatedPrinterLTDimension;
  GantryMaxLeft: number;
}

export interface AnycubicSpoolInfo {
  material_type: string;
  color: number[];
  status: number;
  spool_loaded: boolean;
}

export interface AnycubicSpeedMode {
  description: string;
  mode: number;
}

export interface SelectDropdownProps {
  [key: string | number]: string;
}

export interface AnycubicSpeedModes {
  [key: number]: string;
}

export interface AnycubicCardConfig {
  printer_id?: string;
  vertical?: boolean;
  round?: boolean;
  use_24hr?: boolean;
  temperatureUnit?: TemperatureUnit;
  lightEntityId?: string;
  powerEntityId?: string;
  cameraEntityId?: string;
  monitoredStats?: PrinterCardStatType[];
  scaleFactor?: number;
  slotColors?: string[];
  showSettingsButton?: boolean;
  alwaysShow?: boolean;
  mediaView?: MediaViewType;
  printerArt?: PrinterArtType;
  showMoveButtons?: boolean;
  showControls?: boolean;
  sections?: CardSectionType[];
}

/** Which surface the hero area shows. `Auto` never starts the camera on its own:
 *  a cloud-camera session costs a one-shot Agora token and is taken from whichever
 *  Anycubic session asked most recently, so it is opt-in per view. */
export enum MediaViewType {
  Auto = "auto",
  Camera = "camera",
  Preview = "preview",
  Printer = "printer",
  None = "none",
}

/** Which chassis the printer graphic draws. `Auto` defers to the fuzzy
 *  machine_name match in `selectPrinterArt`, which is right for anything the
 *  cloud names recognisably; the rest force a body for the machines it does
 *  not. The values (apart from `Auto`) must stay identical to `PrinterArtKind`
 *  in printer_view/printer_art.ts -- they are passed straight through as the
 *  override.
 *
 *  `KobraS1Combo` is the odd one: there is no Combo drawing, it is the S1 with
 *  ACE units stacked on top, so choosing it asserts that an ACE is attached
 *  rather than merely picking a picture. */
export enum PrinterArtType {
  Auto = "auto",
  KobraS1 = "kobra_s1",
  KobraS1Combo = "kobra_s1_combo",
  Kobra3 = "kobra_3",
  Resin = "resin",
  FDM = "fdm",
}

export enum CardSectionType {
  Filament = "filament",
  /** @deprecated Move is its own `showMoveButtons` toggle now, shown inline
   *  like the control buttons rather than folded away behind a chevron. The
   *  member stays so a config saved before the change can be migrated (see
   *  printer_card.ts) instead of silently losing its move pad. */
  Move = "move",
  Insights = "insights",
}

/** A camera the card can offer, resolved from the printer's own entities. */
export interface AnycubicCameraChoice {
  entity_id: string;
  /** `true` for the cloud WebRTC camera, which has no still image and no snapshots. */
  isCloud: boolean;
  available: boolean;
}

export enum AnycubicMaterialType {
  PLA = "PLA",
  PETG = "PETG",
  ABS = "ABS",
  PACF = "PACF",
  PC = "PC",
  ASA = "ASA",
  HIPS = "HIPS",
  PA = "PA",
  PLA_SE = "PLA_SE",
}

export enum AnycubicPrintOptionConfirmationType {
  PAUSE = "pause",
  RESUME = "resume",
  CANCEL = "cancel",
}

export interface AnycubicFileListEntity extends HassEntity {
  attributes: HassEntityAttributeBase & {
    file_info?: AnycubicFileLocal[];
  };
}

export interface AnycubicCloudFileListEntity extends HassEntity {
  attributes: HassEntityAttributeBase & {
    file_info?: AnycubicFileCloud[];
  };
}

export interface AnycubicTargetTempEntity extends HassEntity {
  attributes: HassEntityAttributeBase & {
    limit_min: number;
    limit_max: number;
  };
}

export interface AnycubicSpeedModeEntity extends HassEntity {
  attributes: HassEntityAttributeBase & {
    available_modes: AnycubicSpeedMode[];
    print_speed_mode_code: number;
  };
}

export interface AnycubicDryingPresetEntity extends HassEntity {
  attributes: HassEntityAttributeBase & {
    temperature?: number;
    duration?: number;
  };
}

export interface AnycubicSpoolInfoEntity extends HassEntity {
  attributes: HassEntityAttributeBase & {
    spool_info: AnycubicSpoolInfo[];
  };
}

export interface TranslationDict {
  [id: string]: string;
}

export interface HassPanel {
  config: AnycubicCardConfig;
}

export interface PageChangeDetail {
  item: Element;
}

export interface ModalEventBase {
  modalOpen: boolean;
}

export interface ModalEventDrying extends ModalEventBase {
  box_id: number | string;
}

export interface ModalEventSpool extends ModalEventBase {
  box_id: number | string;
  spool_index: number | string;
  material_type?: string;
  color: number[] | string | undefined;
}

export interface FormChangeDetail {
  value: object;
}

export interface TextfieldChangeDetail<TValue> {
  value: TValue;
}

export interface DropdownEvent<KValue, TValue> {
  key: KValue;
  value: TValue;
}

export interface ColourPickEvent {
  color?: {
    rgb: number[];
  };
}

export interface HassServiceError {
  message?: string;
}

export interface HassProgressButton {
  actionSuccess: () => void;
  actionError: () => void;
}

export interface CustomCardEntry {
  type: string;
  name?: string;
  description?: string;
  preview?: boolean;
  documentationURL?: string;
}

export interface CustomCardsWindow {
  customCards?: CustomCardEntry[];
}

export interface AnycubicLitNode {
  route: HassRoute;
}

export interface DomClickEvent<T extends EventTarget> extends Event {
  currentTarget: T;
}

export interface EvtTargPrinterDevId extends EventTarget {
  printer_id: string;
}

export interface EvtTargConfirmationMode extends EventTarget {
  confirmation_type: AnycubicPrintOptionConfirmationType;
}

export interface EvtTargFileInfo extends EventTarget {
  file_info: AnycubicFileCloud | AnycubicFileLocal;
}

export interface EvtTargItemKey extends EventTarget {
  item_key: string | number;
}

export interface EvtTargDirection extends EventTarget {
  direction: number;
}

export interface EvtTargSpoolEdit extends EventTarget {
  index: number;
  material_type: string;
  color: number[];
}

export interface EvtTargEntityPress extends EventTarget {
  entityId: string | undefined;
}

export interface EvtTargSelectOption extends EventTarget {
  entityId: string | undefined;
  option: string;
}

export interface EvtTargCardSection extends EventTarget {
  sectionKey: CardSectionType;
}

export interface EvtTargMediaTab extends EventTarget {
  tabKey: MediaViewType;
}

export interface EvtTargColourPreset extends EventTarget {
  preset: string;
}
