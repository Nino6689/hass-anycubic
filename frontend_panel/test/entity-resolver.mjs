/**
 * The entity resolver against the three registry populations that exist in
 * the wild. Entity-id text is language- and history-dependent: ids slugify
 * from the display name in the server language at REGISTRATION time, and the
 * ACE gained its own device mid-2.x, inserting an "_ace_pro_" infix into
 * every fresh install's ids. The maintainer's own install predates the split,
 * which is exactly why live testing never caught the dead Filament section.
 *
 * Run: node test/entity-resolver.mjs   (esbuild-bundled helpers)
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { getStrictMatchingEntity, getMatchingEntity } = await import(join(here, '.build', 'helpers.js'));

const problems = [];
let cases = 0;

const ent = (id, key) => ({ entity_id: id, translation_key: key, device_id: 'd' });

// Population A: pre-device-split English ids (the maintainer's install).
const PRE = {
  'sensor.anycubic_kobra_s1_ace_spools': ent('sensor.anycubic_kobra_s1_ace_spools', 'ace_spools'),
  'sensor.anycubic_kobra_s1_secondary_ace_spools': ent('sensor.anycubic_kobra_s1_secondary_ace_spools', 'secondary_ace_spools'),
  'sensor.anycubic_kobra_s1_file_list_usb_disk': ent('sensor.anycubic_kobra_s1_file_list_usb_disk', 'file_list_udisk'),
  'button.anycubic_kobra_s1_request_file_list_usb_disk': ent('button.anycubic_kobra_s1_request_file_list_usb_disk', 'request_file_list_udisk'),
  'switch.anycubic_kobra_s1_ace_run_out_refill': ent('switch.anycubic_kobra_s1_ace_run_out_refill', 'ace_run_out_refill'),
};

// Population B: post-split English ids -- the ACE device inserts its infix.
const POST = {
  'sensor.anycubic_kobra_s1_ace_pro_ace_spools': ent('sensor.anycubic_kobra_s1_ace_pro_ace_spools', 'ace_spools'),
  'sensor.anycubic_kobra_s1_ace_pro_2_secondary_ace_spools': ent('sensor.anycubic_kobra_s1_ace_pro_2_secondary_ace_spools', 'secondary_ace_spools'),
  'sensor.anycubic_kobra_s1_file_list_usb_disk': ent('sensor.anycubic_kobra_s1_file_list_usb_disk', 'file_list_udisk'),
  'switch.anycubic_kobra_s1_ace_pro_ace_run_out_refill': ent('switch.anycubic_kobra_s1_ace_pro_ace_run_out_refill', 'ace_run_out_refill'),
};

// Population C: German server language -- ids slugified from German names,
// sharing nothing with any English suffix. Only the translation_key stands.
const DE = {
  'sensor.anycubic_kobra_s1_ace_spulen': ent('sensor.anycubic_kobra_s1_ace_spulen', 'ace_spools'),
  'sensor.anycubic_kobra_s1_dateiliste_usb_laufwerk': ent('sensor.anycubic_kobra_s1_dateiliste_usb_laufwerk', 'file_list_udisk'),
  'switch.anycubic_kobra_s1_ace_nachfuellen': ent('switch.anycubic_kobra_s1_ace_nachfuellen', 'ace_run_out_refill'),
};

const PART = 'anycubic_kobra_s1_';
const expect = (label, got, wantId) => {
  cases++;
  const id = got?.entity_id ?? null;
  if (id !== wantId) problems.push(`${label}: got ${id}, wanted ${wantId}`);
};

for (const [name, pop] of [['pre-split', PRE], ['post-split', POST], ['german', DE]]) {
  expect(`${name}/ace_spools`,
    getStrictMatchingEntity(pop, PART, 'sensor', 'ace_spools'),
    Object.values(pop).find(e => e.translation_key === 'ace_spools')?.entity_id ?? null);
  expect(`${name}/run_out_refill`,
    getStrictMatchingEntity(pop, PART, 'switch', 'ace_run_out_refill'),
    Object.values(pop).find(e => e.translation_key === 'ace_run_out_refill')?.entity_id ?? null);
  expect(`${name}/file_list_udisk`,
    getMatchingEntity(pop, 'sensor', 'file_list_udisk'),
    Object.values(pop).find(e => e.translation_key === 'file_list_udisk')?.entity_id ?? null);
}
// The secondary must never be mistaken for the primary and vice versa.
expect('post-split/secondary',
  getStrictMatchingEntity(POST, PART, 'sensor', 'secondary_ace_spools'),
  'sensor.anycubic_kobra_s1_ace_pro_2_secondary_ace_spools');
expect('pre-split/secondary',
  getStrictMatchingEntity(PRE, PART, 'sensor', 'secondary_ace_spools'),
  'sensor.anycubic_kobra_s1_secondary_ace_spools');
// A registry with NO translation keys (very old HA core strips them?) still
// resolves by suffix -- nothing that worked may stop working.
const NOKEYS = {
  'sensor.anycubic_kobra_s1_ace_spools': { entity_id: 'sensor.anycubic_kobra_s1_ace_spools', device_id: 'd' },
};
expect('no-keys/suffix-fallback',
  getStrictMatchingEntity(NOKEYS, PART, 'sensor', 'ace_spools'),
  'sensor.anycubic_kobra_s1_ace_spools');


// ---------------------------------------------------------------------------
// Issue #25: the prefix itself. The old derivation looked for an id ending in
// the English "printer_online"; on a German install that id is
// "_drucker_online" and the derivation returned undefined -- which the old
// strict lookup treated as "resolve nothing", blanking the card and panel.
// The prefix now comes from the ids' longest common prefix (the device half
// of an id is the cloud's own name and is never localized), and an unknown
// prefix no longer stops the translation-key match.
// ---------------------------------------------------------------------------
const { getPrinterEntityIdPart, getPrinterCameras } = await import(join(here, '.build', 'helpers.js'));

// A realistic German registry: device-name half English, entity half German.
const DE_FULL = {
  'binary_sensor.anycubic_kobra_s1_drucker_online': ent('binary_sensor.anycubic_kobra_s1_drucker_online', 'printer_online'),
  'sensor.anycubic_kobra_s1_aktueller_status': ent('sensor.anycubic_kobra_s1_aktueller_status', 'current_status'),
  'sensor.anycubic_kobra_s1_druckstatus': ent('sensor.anycubic_kobra_s1_druckstatus', 'job_state'),
  'sensor.anycubic_kobra_s1_ace_spulen': ent('sensor.anycubic_kobra_s1_ace_spulen', 'ace_spools'),
  'button.anycubic_kobra_s1_druck_pausieren': ent('button.anycubic_kobra_s1_druck_pausieren', 'pause_print'),
};

{
  cases++;
  const part = getPrinterEntityIdPart(DE_FULL);
  if (part !== 'anycubic_kobra_s1_') problems.push(`derive/german: got ${part}, wanted anycubic_kobra_s1_`);
}
{
  // The trimming edge: "_ace_spulen" and "_aktueller_status" share a first
  // letter, so a raw LCP would be "anycubic_kobra_s1_a". It must trim back.
  cases++;
  const part = getPrinterEntityIdPart({
    'sensor.anycubic_kobra_s1_ace_spulen': ent('sensor.anycubic_kobra_s1_ace_spulen', 'ace_spools'),
    'sensor.anycubic_kobra_s1_aktueller_status': ent('sensor.anycubic_kobra_s1_aktueller_status', 'current_status'),
  });
  if (part !== 'anycubic_kobra_s1_') problems.push(`derive/trim: got ${part}, wanted anycubic_kobra_s1_`);
}
{
  // One renamed entity collapses the common prefix. That must yield
  // undefined -- not a wrong prefix -- and lookups must keep working.
  cases++;
  const renamed = {
    ...DE_FULL,
    'sensor.mein_drucker_status': ent('sensor.mein_drucker_status', 'job_state'),
  };
  const part = getPrinterEntityIdPart(renamed);
  if (part !== undefined) problems.push(`derive/renamed: got ${part}, wanted undefined`);
  const hit = getStrictMatchingEntity(renamed, part, 'sensor', 'current_status');
  if (hit?.entity_id !== 'sensor.anycubic_kobra_s1_aktueller_status')
    problems.push(`strict/no-prefix: got ${hit?.entity_id ?? null}`);
}

// The exact #25 shape end to end: German ids, derived prefix, every lookup
// the status row makes.
for (const [suffix, wantKey] of [
  ['current_status', 'current_status'],
  ['job_state', 'job_state'],
  ['pause_print', 'pause_print'],
]) {
  cases++;
  const part = getPrinterEntityIdPart(DE_FULL);
  const domain = suffix === 'pause_print' ? 'button' : 'sensor';
  const hit = getStrictMatchingEntity(DE_FULL, part, domain, suffix);
  if (hit?.translation_key !== wantKey)
    problems.push(`german-e2e/${suffix}: got ${hit?.entity_id ?? null}`);
}

// Camera identity by key: German and Dutch ids share nothing with the
// English suffix, and Dutch is the sneaky one -- "Cloudcamera" slugs with no
// underscore, so even endsWith("cloud_camera") misses it.
for (const [label, id] of [
  ['german', 'camera.anycubic_kobra_s1_cloud_kamera'],
  ['dutch', 'camera.anycubic_kobra_s1_cloudcamera'],
]) {
  cases++;
  const cams = getPrinterCameras(
    { states: {} },
    {
      [id]: ent(id, 'cloud_camera'),
      ['camera.anycubic_kobra_s1_x']: ent('camera.anycubic_kobra_s1_x', 'camera'),
    },
  );
  const cloud = cams.find((c) => c.entity_id === id);
  if (!cloud?.isCloud) problems.push(`camera/${label}: cloud camera not identified as cloud`);
  const local = cams.find((c) => c.entity_id === 'camera.anycubic_kobra_s1_x');
  if (local?.isCloud) problems.push(`camera/${label}: local camera mistaken for cloud`);
}

// Two printers in one (wrongly unscoped) set: the prefix must prefer its own
// printer's entity over another printer's identical translation key.
{
  cases++;
  const two = {
    'sensor.anycubic_kobra_s1_current_status': ent('sensor.anycubic_kobra_s1_current_status', 'current_status'),
    'sensor.office_kobra_current_status': ent('sensor.office_kobra_current_status', 'current_status'),
  };
  const hit = getStrictMatchingEntity(two, 'office_kobra_', 'sensor', 'current_status');
  if (hit?.entity_id !== 'sensor.office_kobra_current_status')
    problems.push(`two-printers/prefix-preference: got ${hit?.entity_id ?? null}`);
}


// The eleven lookups whose English id-suffix never matched any
// translation_key: temperatures, fan, drying, preview, firmware. Each is
// asked for by its frontend name against a German registry that carries only
// the integration's true key -- the alias table is the only route through.
{
  const ALIASED = [
    ['sensor', 'nozzle_temperature', 'curr_nozzle_temp'],
    ['sensor', 'hotbed_temperature', 'curr_hotbed_temp'],
    ['sensor', 'target_nozzle_temperature', 'target_nozzle_temp'],
    ['sensor', 'target_hotbed_temperature', 'target_hotbed_temp'],
    ['sensor', 'fan_speed', 'fan_speed_pct'],
    ['binary_sensor', 'drying_active', 'dry_status_is_drying'],
    ['sensor', 'drying_remaining_time', 'dry_status_remaining_time'],
    ['sensor', 'drying_total_duration', 'dry_status_total_duration'],
    ['image', 'job_preview', 'job_image_url'],
    ['update', 'printer_firmware', 'fw_version'],
    ['update', 'ace_firmware', 'multi_color_box_fw_version'],
  ];
  for (const [domain, lookup, trueKey] of ALIASED) {
    cases++;
    const id = `${domain}.anycubic_kobra_s1_irgendein_deutscher_name_${trueKey}x`.replace(`_${trueKey}x`, '_deutsch');
    const pop = { [id]: ent(id, trueKey) };
    const hit = getStrictMatchingEntity(pop, 'anycubic_kobra_s1_', domain, lookup);
    if (hit?.entity_id !== id) problems.push(`alias/${lookup}: got ${hit?.entity_id ?? null}`);
  }
  // And the English suffix fallback still carries a registry with no keys.
  cases++;
  const noKeys = { 'sensor.anycubic_kobra_s1_nozzle_temperature': { entity_id: 'sensor.anycubic_kobra_s1_nozzle_temperature', device_id: 'd' } };
  const hit = getStrictMatchingEntity(noKeys, 'anycubic_kobra_s1_', 'sensor', 'nozzle_temperature');
  if (hit?.entity_id !== 'sensor.anycubic_kobra_s1_nozzle_temperature')
    problems.push(`alias/english-fallback: got ${hit?.entity_id ?? null}`);
}

console.log(`  cases: ${cases}`);
if (problems.length) {
  console.log('  FAIL:'); for (const p of problems) console.log('    ' + p);
  process.exit(1);
}
console.log('  PASS - every population, prefix derivation, cameras and buttons resolve');
