const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SAMPLE_LAUNCHES = [
  {
    flight_number: 745,
    mission_name: 'USSF-627',
    launch_year: '2026',
    launch_date_local: '2026-11-12T04:36:30Z',
    launch_success: true,
    rocket: { rocket_id: '164', rocket_name: 'Falcon 9', rocket_type: 'Block 5' },
  },
  {
    flight_number: 325,
    mission_name: 'Starship IFT-4',
    launch_year: '2024',
    launch_date_local: '2024-06-06T12:50:00Z',
    launch_success: true,
    rocket: { rocket_id: '464', rocket_name: 'Starship', rocket_type: 'Block 1' },
  },
  {
    flight_number: 55,
    mission_name: 'Falcon Heavy Demo',
    launch_year: '2018',
    launch_date_local: '2018-02-06T20:45:00Z',
    launch_success: true,
    rocket: { rocket_id: '161', rocket_name: 'Falcon Heavy', rocket_type: 'Heavy' },
  },
  {
    flight_number: 1,
    mission_name: 'FalconSAT-2',
    launch_year: '2006',
    launch_date_local: '2006-03-24T22:30:00Z',
    launch_success: false,
    rocket: { rocket_id: '133', rocket_name: 'Falcon 1', rocket_type: '1' },
  },
];

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

describe('Telemetry pure helpers', () => {
  it('pads flight numbers to 4 digits and handles invalid values safely', async () => {
    const { padFlight } = await import('../client/src/lib/telemetry.js');
    assert.equal(padFlight(745), '0745');
    assert.equal(padFlight(1), '0001');
    assert.equal(padFlight(1234), '1234');
    assert.equal(padFlight(null), '0000');
    assert.equal(padFlight(-5), '0000');
  });

  it('formats valid and invalid ISO timestamps accurately', async () => {
    const { formatTimestamps } = await import('../client/src/lib/telemetry.js');
    const valid = formatTimestamps('2026-11-12T04:36:30Z');
    assert.equal(valid.valid, true);
    assert.equal(valid.utc, '2026-11-12 04:36 UTC');
    assert.ok(valid.local.length > 0 && valid.local !== 'Unknown');

    const invalid = formatTimestamps('not-a-date');
    assert.deepEqual(invalid, {
      utc: 'UNKNOWN UTC',
      local: 'Unknown',
      valid: false,
    });
  });

  it('computes elapsed T+ clock without negative rollover', async () => {
    const { formatElapsedSince } = await import('../client/src/lib/telemetry.js');
    const launch = '2026-11-12T00:00:00Z';
    const oneDayTwoHours = Date.parse('2026-11-13T02:03:04Z');
    assert.equal(formatElapsedSince(launch, oneDayTwoHours), '01d 02h 03m 04s');

    const beforeLaunch = Date.parse('2026-11-11T00:00:00Z');
    assert.equal(formatElapsedSince(launch, beforeLaunch), '00d 00h 00m 00s');
    assert.equal(formatElapsedSince(null, oneDayTwoHours), '--d --h --m --s');
  });

  it('computes Title Block manifest stats and fleet abbreviations', async () => {
    const { computeManifestStats } = await import('../client/src/lib/telemetry.js');
    const stats = computeManifestStats(SAMPLE_LAUNCHES);
    assert.equal(stats.latestFlight, 745);
    assert.equal(stats.totalLogged, 4);
    assert.equal(stats.nominalCount, 3);
    assert.equal(stats.anomalyCount, 1);
    assert.equal(stats.nominalRate, '75.0%');
    assert.equal(stats.activeFleet, 'F9 · STARSHIP · FH');

    const empty = computeManifestStats([]);
    assert.equal(empty.totalLogged, 0);
    assert.equal(empty.nominalRate, '--');
  });

  it('filters launches by status and text query across mission, padded flight #, rocket, and year', async () => {
    const { filterLaunches } = await import('../client/src/lib/telemetry.js');
    assert.equal(filterLaunches(SAMPLE_LAUNCHES, { filter: 'success' }).length, 3);
    assert.equal(filterLaunches(SAMPLE_LAUNCHES, { filter: 'failed' }).length, 1);
    assert.equal(filterLaunches(SAMPLE_LAUNCHES, { query: '0745' })[0].mission_name, 'USSF-627');
    assert.equal(filterLaunches(SAMPLE_LAUNCHES, { query: 'starship' })[0].flight_number, 325);
    assert.equal(filterLaunches(SAMPLE_LAUNCHES, { query: '2018' })[0].flight_number, 55);
  });

  it('returns distinct trajectory profiles for nominal, Starship, Falcon Heavy, and anomaly flights', async () => {
    const { getTrajectoryProfile } = await import('../client/src/lib/telemetry.js');
    const f9 = getTrajectoryProfile(SAMPLE_LAUNCHES[0]);
    const ss = getTrajectoryProfile(SAMPLE_LAUNCHES[1]);
    const fh = getTrajectoryProfile(SAMPLE_LAUNCHES[2]);
    const f1Err = getTrajectoryProfile(SAMPLE_LAUNCHES[3]);

    assert.equal(f9.isNominal, true);
    assert.equal(f9.regime, 'SECO-1 NOMINAL');
    assert.equal(ss.regime, 'SHIP ENTRY NOMINAL');
    assert.equal(fh.regime, 'HEAVY TLI BURN');
    assert.equal(f1Err.isNominal, false);
    assert.equal(f1Err.regime, 'STAGE SEP ANOMALY');
  });
});

describe('1968 NASA / JPL UI design contracts', () => {
  it('removes bootswatch and MissionKey, enforces 0px border-radius, and keeps motion-toggle accessible', () => {
    const root = path.resolve(__dirname, '..');
    const clientPkg = fs.readFileSync(path.join(root, 'client', 'package.json'), 'utf8');
    assert.equal(/bootswatch/i.test(clientPkg), false);
    assert.equal(
      fs.existsSync(path.join(root, 'client', 'src', 'components', 'MissionKey.jsx')),
      false
    );

    const css = fs.readFileSync(path.join(root, 'client', 'src', 'index.css'), 'utf8');
    assert.match(css, /border-radius:\s*0\s*!important/);
    const radiusDecls = css.match(/border-radius:[^;]+;/g) || [];
    const nonZeroRadii = radiusDecls.filter(
      (decl) => !/^border-radius:\s*0(?:px)?(?:\s*!important)?;$/i.test(decl.trim())
    );
    assert.deepEqual(nonZeroRadii, []);

    const srcFiles = walkFiles(path.join(root, 'client', 'src'));
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const withoutBlockComments = content.replace(/\/\*[\s\S]*?\*\//g, '');
      assert.equal(/bootswatch/i.test(content), false, `Found bootswatch in ${file}`);
      assert.equal(/\brounded(?:-[a-z0-9]+)?\b/.test(withoutBlockComments), false, `Found rounded class in ${file}`);
      assert.equal(/->|<-/.test(withoutBlockComments), false, `Found ASCII arrow in ${file}`);
    }

    const layoutSrc = fs.readFileSync(
      path.join(root, 'client', 'src', 'components', 'SheetLayout.jsx'),
      'utf8'
    );
    const motionBtnSection = layoutSrc.slice(
      layoutSrc.indexOf('id="motion-toggle"') - 80,
      layoutSrc.indexOf('id="motion-toggle"') + 120
    );
    assert.equal(/aria-pressed/.test(motionBtnSection), false);
  });
});
