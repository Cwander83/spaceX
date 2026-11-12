const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLList,
  GraphQLSchema,
} = require('graphql');

const LL2_PRIMARY_BASE = 'https://ll.thespacedevs.com/2.2.0';
const LL2_FALLBACK_BASE = 'https://lldev.thespacedevs.com/2.2.0';
const SPACEX_LSP_ID = 121;
const CACHE_TTL_MS = 15 * 60 * 1000;

const OFFLINE_FALLBACK_LAUNCHES = [
  {
    flight_number: 1,
    mission_name: 'FalconSAT-2',
    launch_year: '2006',
    launch_date_local: '2006-03-24T22:30:00Z',
    launch_success: false,
    rocket: { rocket_id: '133', rocket_name: 'Falcon 1', rocket_type: '1' },
  },
  {
    flight_number: 9,
    mission_name: 'CRS-1',
    launch_year: '2012',
    launch_date_local: '2012-10-08T00:35:00Z',
    launch_success: true,
    rocket: { rocket_id: '1', rocket_name: 'Falcon 9', rocket_type: 'v1.0' },
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
    flight_number: 94,
    mission_name: 'Crew Demo-2',
    launch_year: '2020',
    launch_date_local: '2020-05-30T19:22:45Z',
    launch_success: true,
    rocket: { rocket_id: '164', rocket_name: 'Falcon 9', rocket_type: 'Block 5' },
  },
  {
    flight_number: 745,
    mission_name: 'USSF-627',
    launch_year: '2026',
    launch_date_local: '2026-11-12T04:36:30Z',
    launch_success: true,
    rocket: { rocket_id: '164', rocket_name: 'Falcon 9', rocket_type: 'Block 5' },
  },
];

let launchesCache = { data: null, expiresAt: 0 };
let rocketsCache = { data: null, expiresAt: 0 };
const launchByFlightCache = new Map();

/**
 * Fetch JSON from Launch Library 2 primary host, falling back to lldev on rate limit or network error.
 * @param {string} pathAndQuery
 * @returns {Promise<any>}
 */
async function fetchLL2(pathAndQuery) {
  const bases = [LL2_PRIMARY_BASE, LL2_FALLBACK_BASE];
  let lastError;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${pathAndQuery}`, {
        headers: { 'User-Agent': 'spacex-launch-stats/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        lastError = new Error(`LL2 ${base} returned HTTP ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to fetch from Launch Library 2');
}

/**
 * Map a Launch Library 2 launch record into the legacy GraphQL LaunchType shape.
 * @param {any} item
 * @param {number} fallbackNumber
 */
function mapLaunch(item, fallbackNumber) {
  const rocketConfig = (item.rocket && item.rocket.configuration) || {};
  const missionName =
    (item.mission && item.mission.name) ||
    (item.name && item.name.includes('|')
      ? item.name.split('|')[1].trim()
      : item.name) ||
    'Unknown Mission';

  return {
    flight_number:
      typeof item.agency_launch_attempt_count === 'number'
        ? item.agency_launch_attempt_count
        : fallbackNumber,
    mission_name: missionName,
    launch_year: item.net ? String(item.net).slice(0, 4) : null,
    launch_date_local: item.net || null,
    launch_success: Boolean(item.status && item.status.id === 3),
    rocket: {
      rocket_id:
        rocketConfig.id != null ? String(rocketConfig.id) : 'unknown',
      rocket_name: rocketConfig.name || 'Unknown Rocket',
      rocket_type: rocketConfig.variant || rocketConfig.family || 'Unknown',
    },
  };
}

function mapRocketConfig(config) {
  return {
    rocket_id: config.id != null ? String(config.id) : 'unknown',
    rocket_name: config.name || 'Unknown Rocket',
    rocket_type: config.variant || config.family || 'Unknown',
  };
}

async function getLaunches() {
  const now = Date.now();
  if (launchesCache.data && launchesCache.expiresAt > now) {
    return launchesCache.data;
  }

  try {
    const payload = await fetchLL2(
      `/launch/previous/?lsp__id=${SPACEX_LSP_ID}&limit=100`
    );
    const results = Array.isArray(payload.results) ? payload.results : [];
    if (results.length === 0) {
      return OFFLINE_FALLBACK_LAUNCHES;
    }
    const seenFlights = new Set();
    let fallbackNum = results.length;

    const mapped = results.map((item, idx) => {
      const launch = mapLaunch(item, results.length - idx);
      while (seenFlights.has(launch.flight_number)) {
        fallbackNum += 1;
        launch.flight_number = fallbackNum;
      }
      seenFlights.add(launch.flight_number);
      return launch;
    });

    launchesCache = { data: mapped, expiresAt: now + CACHE_TTL_MS };
    return mapped;
  } catch (err) {
    console.warn('LL2 launches fetch failed, using offline fallback:', err.message);
    return OFFLINE_FALLBACK_LAUNCHES;
  }
}

async function getLaunchByFlightNumber(flightNumber) {
  const now = Date.now();
  if (launchesCache.data && launchesCache.expiresAt > now) {
    const cached = launchesCache.data.find(
      (l) => l.flight_number === flightNumber
    );
    if (cached) return cached;
  }

  const singleCached = launchByFlightCache.get(flightNumber);
  if (singleCached && singleCached.expiresAt > now) {
    return singleCached.data;
  }

  try {
    const payload = await fetchLL2(
      `/launch/?lsp__id=${SPACEX_LSP_ID}&agency_launch_attempt_count=${flightNumber}`
    );
    const first =
      Array.isArray(payload.results) && payload.results.length > 0
        ? mapLaunch(payload.results[0], flightNumber)
        : OFFLINE_FALLBACK_LAUNCHES.find(
            (l) => l.flight_number === flightNumber
          ) || null;
    if (first) {
      launchByFlightCache.set(flightNumber, {
        data: first,
        expiresAt: now + CACHE_TTL_MS,
      });
    }
    return first;
  } catch (err) {
    console.warn(
      `LL2 launch ${flightNumber} fetch failed, checking offline fallback:`,
      err.message
    );
    return (
      OFFLINE_FALLBACK_LAUNCHES.find((l) => l.flight_number === flightNumber) ||
      null
    );
  }
}

async function getRockets() {
  const now = Date.now();
  if (rocketsCache.data && rocketsCache.expiresAt > now) {
    return rocketsCache.data;
  }

  try {
    const payload = await fetchLL2(
      '/config/launcher/?manufacturer__name=SpaceX&limit=50'
    );
    const results = Array.isArray(payload.results) ? payload.results : [];
    if (results.length === 0) {
      return OFFLINE_FALLBACK_LAUNCHES.map((l) => l.rocket);
    }
    const mapped = results.map(mapRocketConfig);
    rocketsCache = { data: mapped, expiresAt: now + CACHE_TTL_MS };
    return mapped;
  } catch (err) {
    console.warn('LL2 rockets fetch failed, using offline fallback:', err.message);
    return OFFLINE_FALLBACK_LAUNCHES.map((l) => l.rocket);
  }
}

async function getRocketById(id) {
  const now = Date.now();
  const idStr = String(id);
  if (rocketsCache.data && rocketsCache.expiresAt > now) {
    const cached = rocketsCache.data.find((r) => r.rocket_id === idStr);
    if (cached) return cached;
  }

  try {
    const config = await fetchLL2(`/config/launcher/${id}/`);
    return config && config.id != null ? mapRocketConfig(config) : null;
  } catch (err) {
    console.warn(`LL2 rocket ${id} fetch failed:`, err.message);
    return null;
  }
}

// Launch type
const LaunchType = new GraphQLObjectType({
  name: 'Launch',
  fields: () => ({
    flight_number: { type: GraphQLInt },
    mission_name: { type: GraphQLString },
    launch_year: { type: GraphQLString },
    launch_date_local: { type: GraphQLString },
    launch_success: { type: GraphQLBoolean },
    rocket: { type: RocketType },
  }),
});

// Rocket type
const RocketType = new GraphQLObjectType({
  name: 'Rocket',
  fields: () => ({
    rocket_id: { type: GraphQLString },
    rocket_name: { type: GraphQLString },
    rocket_type: { type: GraphQLString },
  }),
});

// Root Query
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    launches: {
      type: new GraphQLList(LaunchType),
      resolve() {
        return getLaunches();
      },
    },
    launch: {
      type: LaunchType,
      args: {
        flight_number: { type: GraphQLInt },
      },
      resolve(parent, args) {
        return getLaunchByFlightNumber(args.flight_number);
      },
    },
    rockets: {
      type: new GraphQLList(RocketType),
      resolve() {
        return getRockets();
      },
    },
    rocket: {
      type: RocketType,
      args: {
        id: { type: GraphQLInt },
      },
      resolve(parent, args) {
        return getRocketById(args.id);
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
});
