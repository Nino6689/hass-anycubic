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

console.log(`  cases: ${cases}`);
if (problems.length) {
  console.log('  FAIL:'); for (const p of problems) console.log('    ' + p);
  process.exit(1);
}
console.log('  PASS - all three registry populations resolve');
