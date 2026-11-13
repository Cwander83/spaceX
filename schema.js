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
    status_name: 'Launch Failure',
    status_abbrev: 'Failure',
    mission_description:
      'Inaugural Falcon 1 orbital demonstration flight carrying the USAFA FalconSAT-2 magnetosphere probe; terminated roughly 33 seconds after liftoff due to a fuel leak and fire.',
    orbit_name: 'Low Earth Orbit',
    orbit_abbrev: 'LEO',
    pad_name: 'Omelek Island',
    pad_location: 'Kwajalein Atoll, Marshall Islands',
    webcast_url: null,
    webcast_live: false,
    rocket: { rocket_id: '133', rocket_name: 'Falcon 1', rocket_type: '1' },
  },
  {
    flight_number: 9,
    mission_name: 'CRS-1',
    launch_year: '2012',
    launch_date_local: '2012-10-08T00:35:00Z',
    launch_success: true,
    status_name: 'Launch Successful',
    status_abbrev: 'Success',
    mission_description:
      'First operational Commercial Resupply Services cargo flight of the Dragon spacecraft to the International Space Station.',
    orbit_name: 'Low Earth Orbit',
    orbit_abbrev: 'LEO',
    pad_name: 'Space Launch Complex 40',
    pad_location: 'Cape Canaveral SFS, FL, USA',
    webcast_url: null,
    webcast_live: false,
    rocket: { rocket_id: '1', rocket_name: 'Falcon 9', rocket_type: 'v1.0' },
  },
  {
    flight_number: 55,
    mission_name: 'Falcon Heavy Demo',
    launch_year: '2018',
    launch_date_local: '2018-02-06T20:45:00Z',
    launch_success: true,
    status_name: 'Launch Successful',
    status_abbrev: 'Success',
    mission_description:
      'Maiden demonstration launch of the Falcon Heavy heavy-lift launch vehicle, placing a dummy payload into a heliocentric Mars-crossing orbit.',
    orbit_name: 'Heliocentric Orbit',
    orbit_abbrev: 'HCO',
    pad_name: 'Launch Complex 39A',
    pad_location: 'Kennedy Space Center, FL, USA',
    webcast_url: null,
    webcast_live: false,
    rocket: { rocket_id: '161', rocket_name: 'Falcon Heavy', rocket_type: 'Heavy' },
  },
  {
    flight_number: 94,
    mission_name: 'Crew Demo-2',
    launch_year: '2020',
    launch_date_local: '2020-05-30T19:22:45Z',
    launch_success: true,
    status_name: 'Launch Successful',
    status_abbrev: 'Success',
    mission_description:
      'First crewed orbital test flight of Crew Dragon Endeavour carrying NASA astronauts to the International Space Station.',
    orbit_name: 'Low Earth Orbit',
    orbit_abbrev: 'LEO',
    pad_name: 'Launch Complex 39A',
    pad_location: 'Kennedy Space Center, FL, USA',
    webcast_url: null,
    webcast_live: false,
    rocket: { rocket_id: '164', rocket_name: 'Falcon 9', rocket_type: 'Block 5' },
  },
  {
    flight_number: 745,
    mission_name: 'USSF-627',
    launch_year: '2026',
    launch_date_local: '2026-11-12T04:36:30Z',
    launch_success: true,
    status_name: 'Launch Successful',
    status_abbrev: 'Success',
    mission_description:
      'National security space launch mission deployed aboard a Falcon 9 Block 5 from Vandenberg Space Force Base.',
    orbit_name: 'Low Earth Orbit',
    orbit_abbrev: 'LEO',
    pad_name: 'Space Launch Complex 4E',
    pad_location: 'Vandenberg SFB, CA, USA',
    webcast_url: null,
    webcast_live: false,
    rocket: { rocket_id: '164', rocket_name: 'Falcon 9', rocket_type: 'Block 5' },
  },
];

function getOfflineFallbackUpcoming() {
  const now = Date.now();
  const buildNet = (hoursFromNow) =>
    new Date(now + hoursFromNow * 60 * 60 * 1000).toISOString();

  return [
    {
      launch_id: 'offline-upcoming-1',
      flight_number: 746,
      mission_name: 'Starlink Group 31-2 (Starship Flight 15)',
      launch_year: new Date(now + 36 * 60 * 60 * 1000).toISOString().slice(0, 4),
      net: buildNet(36),
      status_name: 'To Be Confirmed',
      status_abbrev: 'TBC',
      mission_description:
        'Orbital deployment mission aboard Starship V3 carrying next-generation Starlink satellites to Low Earth Orbit.',
      orbit_name: 'Low Earth Orbit',
      orbit_abbrev: 'LEO',
      pad_name: 'Orbital Launch Pad 2',
      pad_location: 'SpaceX Starbase, TX, USA',
      webcast_url: null,
      webcast_live: false,
      rocket: { rocket_id: '522', rocket_name: 'Starship', rocket_type: 'V3' },
    },
    {
      launch_id: 'offline-upcoming-2',
      flight_number: 747,
      mission_name: 'USSF-317',
      launch_year: new Date(now + 72 * 60 * 60 * 1000).toISOString().slice(0, 4),
      net: buildNet(72),
      status_name: 'Go for Launch',
      status_abbrev: 'Go',
      mission_description:
        'Dedicated national security payload scheduled aboard a Falcon 9 Block 5 vehicle.',
      orbit_name: 'Low Earth Orbit',
      orbit_abbrev: 'LEO',
      pad_name: 'Space Launch Complex 4E',
      pad_location: 'Vandenberg SFB, CA, USA',
      webcast_url: null,
      webcast_live: false,
      rocket: { rocket_id: '164', rocket_name: 'Falcon 9', rocket_type: 'Block 5' },
    },
    {
      launch_id: 'offline-upcoming-3',
      flight_number: 748,
      mission_name: 'USSF-266',
      launch_year: new Date(now + 120 * 60 * 60 * 1000).toISOString().slice(0, 4),
      net: buildNet(120),
      status_name: 'To Be Determined',
      status_abbrev: 'TBD',
      mission_description:
        'Polar orbit constellation deployment mission launching from Vandenberg SFB.',
      orbit_name: 'Polar Orbit',
      orbit_abbrev: 'PO',
      pad_name: 'Space Launch Complex 4E',
      pad_location: 'Vandenberg SFB, CA, USA',
      webcast_url: null,
      webcast_live: false,
      rocket: { rocket_id: '164', rocket_name: 'Falcon 9', rocket_type: 'Block 5' },
    },
  ];
}

let launchesCache = { data: null, expiresAt: 0 };
let upcomingCache = { data: null, expiresAt: 0 };
let rocketsCache = { data: null, expiresAt: 0 };
const launchByFlightCache = new Map();

/**
 * Select the highest-priority valid HTTP(S) webcast URL from Launch Library 2 vidURLs.
 * Official webcasts (type.id === 1) take precedence over higher-priority unofficial streams.
 * @param {any} vidURLs
 * @returns {string | null}
 */
function pickWebcastUrl(vidURLs) {
  if (!Array.isArray(vidURLs) || vidURLs.length === 0) return null;

  const normalized = vidURLs
    .map((entry) => {
      if (typeof entry === 'string') {
        return { url: entry, isOfficial: false, priority: 0 };
      }
      if (entry && typeof entry.url === 'string') {
        return {
          url: entry.url,
          isOfficial: Boolean(entry.type && entry.type.id === 1),
          priority: typeof entry.priority === 'number' ? entry.priority : 0,
        };
      }
      return null;
    })
    .filter((entry) => entry && /^https?:\/\//i.test(entry.url));

  if (normalized.length === 0) return null;

  normalized.sort((a, b) => {
    if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
    return b.priority - a.priority;
  });

  return normalized[0].url;
}

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

function extractBaseLaunchFields(item) {
  const rocketConfig = (item.rocket && item.rocket.configuration) || {};
  const missionName =
    (item.mission && item.mission.name) ||
    (item.name && item.name.includes('|')
      ? item.name.split('|')[1].trim()
      : item.name) ||
    'Unknown Mission';

  return {
    mission_name: missionName,
    launch_year: item.net ? String(item.net).slice(0, 4) : null,
    status_name: (item.status && item.status.name) || null,
    status_abbrev: (item.status && item.status.abbrev) || null,
    mission_description: (item.mission && item.mission.description) || null,
    orbit_name:
      (item.mission && item.mission.orbit && item.mission.orbit.name) || null,
    orbit_abbrev:
      (item.mission && item.mission.orbit && item.mission.orbit.abbrev) || null,
    pad_name: (item.pad && item.pad.name) || null,
    pad_location:
      (item.pad && item.pad.location && item.pad.location.name) || null,
    webcast_url: pickWebcastUrl(item.vidURLs || item.vid_urls),
    webcast_live: Boolean(item.webcast_live),
    rocket: {
      rocket_id:
        rocketConfig.id != null ? String(rocketConfig.id) : 'unknown',
      rocket_name: rocketConfig.name || 'Unknown Rocket',
      rocket_type: rocketConfig.variant || rocketConfig.family || 'Unknown',
    },
  };
}

/**
 * Map a Launch Library 2 launch record into the GraphQL LaunchType shape.
 * @param {any} item
 * @param {number} fallbackNumber
 */
function mapLaunch(item, fallbackNumber) {
  return {
    flight_number:
      typeof item.agency_launch_attempt_count === 'number'
        ? item.agency_launch_attempt_count
        : fallbackNumber,
    ...extractBaseLaunchFields(item),
    launch_date_local: item.net || null,
    launch_success: Boolean(item.status && item.status.id === 3),
  };
}

/**
 * Map a Launch Library 2 upcoming launch record into UpcomingLaunchType shape.
 * @param {any} item
 * @param {number} idx
 */
function mapUpcomingLaunch(item, idx) {
  return {
    launch_id: String((item && item.id) || `upcoming-${idx + 1}`),
    flight_number:
      typeof item.agency_launch_attempt_count === 'number'
        ? item.agency_launch_attempt_count
        : null,
    ...extractBaseLaunchFields(item),
    net: item.net || null,
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
  const singleCached = launchByFlightCache.get(flightNumber);
  if (singleCached && singleCached.expiresAt > now) {
    return singleCached.data;
  }

  try {
    const payload = await fetchLL2(
      `/launch/?lsp__id=${SPACEX_LSP_ID}&agency_launch_attempt_count=${flightNumber}&mode=detailed`
    );
    const listFallback =
      launchesCache.data && launchesCache.expiresAt > now
        ? launchesCache.data.find((l) => l.flight_number === flightNumber)
        : null;
    const first =
      Array.isArray(payload.results) && payload.results.length > 0
        ? mapLaunch(payload.results[0], flightNumber)
        : listFallback ||
          OFFLINE_FALLBACK_LAUNCHES.find(
            (l) => l.flight_number === flightNumber
          ) ||
          null;
    if (first) {
      launchByFlightCache.set(flightNumber, {
        data: first,
        expiresAt: now + CACHE_TTL_MS,
      });
    }
    return first;
  } catch (err) {
    console.warn(
      `LL2 launch ${flightNumber} fetch failed, checking cache and offline fallback:`,
      err.message
    );
    if (launchesCache.data && launchesCache.expiresAt > now) {
      const listFallback = launchesCache.data.find(
        (l) => l.flight_number === flightNumber
      );
      if (listFallback) return listFallback;
    }
    return (
      OFFLINE_FALLBACK_LAUNCHES.find((l) => l.flight_number === flightNumber) ||
      null
    );
  }
}

async function getUpcomingLaunches() {
  const now = Date.now();
  if (upcomingCache.data && upcomingCache.expiresAt > now) {
    return upcomingCache.data;
  }

  try {
    const payload = await fetchLL2(
      `/launch/upcoming/?lsp__id=${SPACEX_LSP_ID}&hide_recent_previous=true&limit=20`
    );
    const results = Array.isArray(payload.results) ? payload.results : [];
    const activeUpcoming = results.filter(
      (item) => !(item && item.status && (item.status.id === 3 || item.status.id === 4))
    );
    if (activeUpcoming.length === 0) {
      return getOfflineFallbackUpcoming();
    }
    const mapped = activeUpcoming.map((item, idx) =>
      mapUpcomingLaunch(item, idx)
    );
    upcomingCache = { data: mapped, expiresAt: now + CACHE_TTL_MS };
    return mapped;
  } catch (err) {
    console.warn(
      'LL2 upcoming launches fetch failed, using offline fallback:',
      err.message
    );
    return getOfflineFallbackUpcoming();
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
    status_name: { type: GraphQLString },
    status_abbrev: { type: GraphQLString },
    mission_description: { type: GraphQLString },
    orbit_name: { type: GraphQLString },
    orbit_abbrev: { type: GraphQLString },
    pad_name: { type: GraphQLString },
    pad_location: { type: GraphQLString },
    webcast_url: { type: GraphQLString },
    webcast_live: { type: GraphQLBoolean },
    rocket: { type: RocketType },
  }),
});

// UpcomingLaunch type
const UpcomingLaunchType = new GraphQLObjectType({
  name: 'UpcomingLaunch',
  fields: () => ({
    launch_id: { type: GraphQLString },
    flight_number: { type: GraphQLInt },
    mission_name: { type: GraphQLString },
    launch_year: { type: GraphQLString },
    net: { type: GraphQLString },
    status_name: { type: GraphQLString },
    status_abbrev: { type: GraphQLString },
    mission_description: { type: GraphQLString },
    orbit_name: { type: GraphQLString },
    orbit_abbrev: { type: GraphQLString },
    pad_name: { type: GraphQLString },
    pad_location: { type: GraphQLString },
    webcast_url: { type: GraphQLString },
    webcast_live: { type: GraphQLBoolean },
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
    upcomingLaunches: {
      type: new GraphQLList(UpcomingLaunchType),
      resolve() {
        return getUpcomingLaunches();
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
