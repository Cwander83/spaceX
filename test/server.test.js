const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

const MOCK_LL2_LAUNCHES = {
  results: [
    {
      agency_launch_attempt_count: 1,
      name: 'Falcon 1 | FalconSAT-2',
      mission: { name: 'FalconSAT-2' },
      net: '2006-03-24T22:30:00Z',
      status: { id: 4 },
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
      mission: { name: 'Crew Demo-2' },
      net: '2020-05-30T19:22:45Z',
      status: { id: 3 },
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
          '{ launches { flight_number mission_name launch_year launch_date_local launch_success rocket { rocket_id rocket_name rocket_type } } }',
      }),
    });
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.errors, undefined);
    assert.ok(Array.isArray(payload.data?.launches));
    assert.ok(payload.data.launches.length > 0);
  });

  it('POST /graphql returns launch for flight_number 1', async () => {
    const res = await originalFetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ launch(flight_number: 1) { flight_number mission_name } }',
      }),
    });
    assert.equal(res.status, 200);
    const payload = await res.json();
    assert.equal(payload.errors, undefined);
    assert.equal(payload.data?.launch?.flight_number, 1);
    assert.equal(payload.data?.launch?.mission_name, 'FalconSAT-2');
  });
});
