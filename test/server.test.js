const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

const MOCK_LL2_LAUNCHES = {
  results: [
    {
      agency_launch_attempt_count: 1,
      name: 'Falcon 1 | FalconSAT-2',
      mission: {
        name: 'FalconSAT-2',
        description: 'Inaugural Falcon 1 orbital test carrying FalconSAT-2.',
        orbit: { name: 'Low Earth Orbit', abbrev: 'LEO' },
      },
      pad: {
        name: 'Omelek Island',
        location: { name: 'Kwajalein Atoll, Marshall Islands' },
      },
      net: '2006-03-24T22:30:00Z',
      status: { id: 4, name: 'Launch Failure', abbrev: 'Failure' },
      webcast_live: false,
      vidURLs: [
        {
          priority: 9,
          type: { id: 4, name: 'Unofficial' },
          url: 'https://example.com/unofficial-stream',
        },
        {
          priority: 5,
          type: { id: 1, name: 'Official Webcast' },
          url: 'https://youtube.com/watch?v=official-f1',
        },
      ],
      rocket: {
        configuration: {
          id: 133,
          name: 'Falcon 1',
          variant: '1',
        },
      },
    },
    {
      agency_launch_attempt_count: 94,
      name: 'Falcon 9 Block 5 | Crew Demo-2',
      mission: {
        name: 'Crew Demo-2',
        description: 'First crewed orbital test flight of Crew Dragon.',
        orbit: { name: 'Low Earth Orbit', abbrev: 'LEO' },
      },
      pad: {
        name: 'Launch Complex 39A',
        location: { name: 'Kennedy Space Center, FL, USA' },
      },
      net: '2020-05-30T19:22:45Z',
      status: { id: 3, name: 'Launch Successful', abbrev: 'Success' },
      webcast_live: false,
      rocket: {
        configuration: {
          id: 164,
          name: 'Falcon 9',
          variant: 'Block 5',
        },
      },
    },
  ],
};

const MOCK_LL2_UPCOMING = {
  results: [
    {
      id: 'recent-completed-item',
      agency_launch_attempt_count: 745,
      name: 'Falcon 9 Block 5 | USSF-627',
      mission: {
        name: 'USSF-627',
        description: 'Already completed mission that must be filtered.',
        orbit: { name: 'Low Earth Orbit', abbrev: 'LEO' },
      },
      pad: {
        name: 'Space Launch Complex 4E',
        location: { name: 'Vandenberg SFB, CA, USA' },
      },
      net: '2026-11-12T04:36:30Z',
      status: { id: 3, name: 'Launch Successful', abbrev: 'Success' },
      webcast_live: false,
      rocket: {
        configuration: {
          id: 164,
          name: 'Falcon 9',
          variant: 'Block 5',
        },
      },
    },
    {
      id: 'upcoming-starship-15',
      agency_launch_attempt_count: 746,
      name: 'Starship | Starlink Group 31-2',
      mission: {
        name: 'Starlink Group 31-2',
        description: 'Starship V3 Starlink orbital mission.',
        orbit: { name: 'Low Earth Orbit', abbrev: 'LEO' },
      },
      pad: {
        name: 'Orbital Launch Pad 2',
        location: { name: 'SpaceX Starbase, TX, USA' },
      },
      net: '2027-01-15T18:00:00Z',
      status: { id: 8, name: 'To Be Confirmed', abbrev: 'TBC' },
      webcast_live: false,
      rocket: {
        configuration: {
          id: 522,
          name: 'Starship',
          variant: 'V3',
        },
      },
    },
    {
      id: 'upcoming-ussf-317',
      agency_launch_attempt_count: null,
      name: 'Falcon 9 Block 5 | USSF-317',
      mission: {
        name: 'USSF-317',
        description: 'Dedicated national security spaceflight mission.',
        orbit: { name: 'Polar Orbit', abbrev: 'PO' },
      },
      pad: {
        name: 'Space Launch Complex 4E',
        location: { name: 'Vandenberg SFB, CA, USA' },
      },
      net: '2027-02-01T03:55:00Z',
      status: { id: 1, name: 'Go for Launch', abbrev: 'Go' },
      webcast_live: true,
      vidURLs: ['https://youtube.com/watch?v=ussf-317'],
      rocket: {
        configuration: {
          id: 164,
          name: 'Falcon 9',
          variant: 'Block 5',
        },
      },
    },
  ],
};

describe('GraphQL & Express 5 server', () => {
  let server;
  let baseUrl;
  let originalFetch;

  before(async () => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (
        url.startsWith('https://ll.thespacedevs.com/') ||
        url.startsWith('https://lldev.thespacedevs.com/')
      ) {
        if (url.includes('/launch/upcoming/')) {
          return new Response(JSON.stringify(MOCK_LL2_UPCOMING), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('agency_launch_attempt_count=1')) {
          return new Response(
            JSON.stringify({ results: [MOCK_LL2_LAUNCHES.results[0]] }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
        return new Response(JSON.stringify(MOCK_LL2_LAUNCHES), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(input, init);
    };

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it('GET /graphql with Accept: text/html returns GraphiQL HTML', async () => {
    const res = await originalFetch(`${baseUrl}/graphql`, {
      headers: { Accept: 'text/html' },
    });
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assert.match(contentType, /text\/html/);
    const body = await res.text();
    assert.match(body, /GraphiQL/);
  });

  it('POST /graphql returns launches list without errors', async () => {
    const res = await originalFetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          '{ launches { flight_number mission_name launch_year launch_date_local launch_success pad_name orbit_abbrev status_name rocket { rocket_id rocket_name rocket_type } } }',
      }),
    });
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.errors, undefined);
    assert.ok(Array.isArray(payload.data?.launches));
    assert.ok(payload.data.launches.length > 0);
  });

  it('POST /graphql returns expanded dossier fields for flight_number 1', async () => {
    const res = await originalFetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          '{ launch(flight_number: 1) { flight_number mission_name pad_name pad_location orbit_name orbit_abbrev status_name webcast_url mission_description } }',
      }),
    });
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.errors, undefined);
    assert.equal(payload.data?.launch?.flight_number, 1);
    assert.equal(payload.data?.launch?.mission_name, 'FalconSAT-2');
    assert.equal(payload.data?.launch?.pad_name, 'Omelek Island');
    assert.equal(payload.data?.launch?.orbit_abbrev, 'LEO');
    assert.equal(
      payload.data?.launch?.webcast_url,
      'https://youtube.com/watch?v=official-f1'
    );
    assert.match(
      payload.data?.launch?.mission_description || '',
      /Falcon 1 orbital test/
    );
  });

  it('POST /graphql returns upcomingLaunches excluding recently completed missions', async () => {
    const res = await originalFetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          '{ upcomingLaunches { launch_id flight_number mission_name net status_abbrev pad_name orbit_abbrev webcast_url webcast_live rocket { rocket_name rocket_type } } }',
      }),
    });
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.errors, undefined);
    const list = payload.data?.upcomingLaunches || [];
    assert.equal(list.length, 2);
    assert.equal(list[0].launch_id, 'upcoming-starship-15');
    assert.equal(list[1].launch_id, 'upcoming-ussf-317');
    assert.equal(list[1].flight_number, null);
    assert.equal(list[1].status_abbrev, 'Go');
    assert.equal(list[1].webcast_url, 'https://youtube.com/watch?v=ussf-317');
  });

  it('GET / uses strong content-hash ETag, busts stale weak ETags, and caches no-cache', async () => {
    const res = await originalFetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /text\/html/);
    assert.match(res.headers.get('cache-control') || '', /no-cache/);
    const etag = res.headers.get('etag') || '';
    assert.match(etag, /^"[0-9a-f]{16}"$/);

    const staleRes = await originalFetch(`${baseUrl}/`, {
      headers: { 'If-None-Match': 'W/"278-1668f272800"' },
    });
    assert.equal(staleRes.status, 200);

    const freshRes = await originalFetch(`${baseUrl}/`, {
      headers: { 'If-None-Match': etag },
    });
    assert.equal(freshRes.status, 304);

    const upcomingRes = await originalFetch(`${baseUrl}/upcoming`);
    assert.equal(upcomingRes.status, 200);
    assert.match(upcomingRes.headers.get('content-type') || '', /text\/html/);
    assert.equal(upcomingRes.headers.get('etag'), etag);
  });

  it('GET missing /assets/*.js returns 404 text/plain instead of 200 text/html', async () => {
    const res = await originalFetch(`${baseUrl}/assets/index-CddEXygh.js`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') || '', /text\/plain/);
  });
});
