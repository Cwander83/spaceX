/**
 * Zero-pad a flight number to 4 digits (e.g. 745 -> "0745").
 * @param {number | string | null | undefined} value
 * @returns {string}
 */
export function padFlight(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return '0000';
  return String(Math.trunc(num)).padStart(4, '0');
}

/**
 * Format an ISO timestamp into both fixed UTC and viewer-local date/time strings.
 * @param {string | null | undefined} iso
 * @returns {{ utc: string, local: string, valid: boolean }}
 */
export function formatTimestamps(iso) {
  if (!iso) {
    return { utc: 'UNKNOWN UTC', local: 'Unknown', valid: false };
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { utc: 'UNKNOWN UTC', local: 'Unknown', valid: false };
  }

  const utc = `${date.toISOString().replace('T', ' ').slice(0, 16)} UTC`;
  const local = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return { utc, local, valid: true };
}

/**
 * Format elapsed time since launch ISO timestamp as "DDd HHh MMm SSs".
 * @param {string | null | undefined} iso
 * @param {number} [nowMs]
 * @returns {string}
 */
export function formatElapsedSince(iso, nowMs = Date.now()) {
  if (!iso) return '--d --h --m --s';
  const launchMs = Date.parse(iso);
  if (Number.isNaN(launchMs)) return '--d --h --m --s';

  const diffSec = Math.max(0, Math.floor((nowMs - launchMs) / 1000));
  const d = String(Math.floor(diffSec / 86400)).padStart(2, '0');
  const h = String(Math.floor((diffSec % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const s = String(diffSec % 60).padStart(2, '0');
  return `${d}d ${h}h ${m}m ${s}s`;
}

function abbreviateRocketName(name) {
  if (!name) return '';
  if (/falcon\s*9/i.test(name)) return 'F9';
  if (/falcon\s*heavy/i.test(name)) return 'FH';
  if (/falcon\s*1/i.test(name)) return 'F1';
  if (/starship/i.test(name)) return 'STARSHIP';
  return name.toUpperCase();
}

/**
 * Compute summary telemetry metrics for the Engineering Title Block.
 * @param {Array<any>} launches
 */
export function computeManifestStats(launches = []) {
  if (!Array.isArray(launches) || launches.length === 0) {
    return {
      latestFlight: null,
      totalLogged: 0,
      nominalRate: '--',
      activeFleet: 'F9 · FH · STARSHIP',
      latestIso: null,
      nominalCount: 0,
      anomalyCount: 0,
    };
  }

  let nominalCount = 0;
  let anomalyCount = 0;
  let latestLaunch = launches[0];
  let maxFlight = launches[0]?.flight_number ?? 0;
  const fleetCodes = [];

  for (const item of launches) {
    if (item?.launch_success) {
      nominalCount += 1;
    } else {
      anomalyCount += 1;
    }

    const fn = typeof item?.flight_number === 'number' ? item.flight_number : 0;
    if (fn >= maxFlight) {
      maxFlight = fn;
      latestLaunch = item;
    }

    const code = abbreviateRocketName(item?.rocket?.rocket_name);
    if (code && !fleetCodes.includes(code) && fleetCodes.length < 3) {
      fleetCodes.push(code);
    }
  }

  const latestWithIso =
    launches.find(
      (item) =>
        item?.launch_date_local && !Number.isNaN(Date.parse(item.launch_date_local))
    ) || latestLaunch;

  return {
    latestFlight: latestLaunch?.flight_number ?? null,
    totalLogged: launches.length,
    nominalRate: `${((nominalCount / launches.length) * 100).toFixed(1)}%`,
    activeFleet: fleetCodes.length > 0 ? fleetCodes.join(' · ') : 'F9 · FH · STARSHIP',
    latestIso: latestWithIso?.launch_date_local ?? null,
    nominalCount,
    anomalyCount,
  };
}

/**
 * Filter launches by status tab ("all" | "success" | "failed") and free-text query.
 * @param {Array<any>} launches
 * @param {{ filter?: string, query?: string }} [options]
 */
export function filterLaunches(launches = [], { filter = 'all', query = '' } = {}) {
  if (!Array.isArray(launches)) return [];
  const q = String(query).trim().toLowerCase();

  return launches.filter((item) => {
    if (filter === 'success' && !item?.launch_success) return false;
    if (filter === 'failed' && item?.launch_success) return false;
    if (!q) return true;

    const flightStr = String(item?.flight_number ?? '');
    const paddedStr = padFlight(item?.flight_number);
    const mission = String(item?.mission_name ?? '').toLowerCase();
    const year = String(item?.launch_year ?? '').toLowerCase();
    const rocketName = String(item?.rocket?.rocket_name ?? '').toLowerCase();
    const rocketType = String(item?.rocket?.rocket_type ?? '').toLowerCase();

    return (
      mission.includes(q) ||
      flightStr.includes(q) ||
      paddedStr.includes(q) ||
      year.includes(q) ||
      rocketName.includes(q) ||
      rocketType.includes(q)
    );
  });
}

/**
 * Derive plotter bezier curve control points and telemetry labels for a launch.
 * @param {any} launch
 */
export function getTrajectoryProfile(launch) {
  if (!launch) {
    return {
      curve: { p1x: 0.25, p1y: 0.25, p2x: 0.58, p2y: 0.21, p3x: 0.91, p3y: 0.34 },
      regime: 'STANDBY',
      readout: 'AWAITING TELEMETRY',
      eventLabel: 'MECO',
      isNominal: true,
    };
  }

  if (!launch.launch_success) {
    return {
      curve: { p1x: 0.22, p1y: 0.28, p2x: 0.44, p2y: 0.36, p3x: 0.57, p3y: 0.78 },
      regime: 'STAGE SEP ANOMALY',
      readout: '140 km PEAK · FTS ABORT',
      eventLabel: 'STAGE SEP FAULT',
      isNominal: false,
    };
  }

  const rocketName = launch.rocket?.rocket_name || '';
  const rocketType = launch.rocket?.rocket_type || '';

  if (/starship/i.test(rocketName)) {
    return {
      curve: { p1x: 0.20, p1y: 0.20, p2x: 0.56, p2y: 0.14, p3x: 0.90, p3y: 0.28 },
      regime: 'SHIP ENTRY NOMINAL',
      readout: '7.51 km/s · 211 km ALT',
      eventLabel: 'HOT-STAGE',
      isNominal: true,
    };
  }

  if (/heavy/i.test(rocketName) || /heavy/i.test(rocketType)) {
    return {
      curve: { p1x: 0.28, p1y: 0.18, p2x: 0.62, p2y: 0.15, p3x: 0.92, p3y: 0.22 },
      regime: 'HEAVY TLI BURN',
      readout: '10.8 km/s · 520 km ALT',
      eventLabel: 'BECO / MECO',
      isNominal: true,
    };
  }

  return {
    curve: { p1x: 0.25, p1y: 0.25, p2x: 0.58, p2y: 0.21, p3x: 0.91, p3y: 0.34 },
    regime: 'SECO-1 NOMINAL',
    readout: '7.66 km/s · 412 km ALT',
    eventLabel: 'MECO',
    isNominal: true,
  };
}
