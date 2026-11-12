# spaceX

SpaceX Launch Stats application built with Express 5, GraphQL (`graphql-http`), React 19, Apollo Client 4, and Vite 8.

## Architecture

- **Backend**: Node.js (`>=22.12.0`), Express 5, `graphql`, and `graphql-http` on port `5001` (`process.env.PORT || 5001`), serving `/graphql` (with interactive GraphiQL 3 on browser `GET /graphql`) and static production assets from `public/`.
- **Data Source**: Launch Library 2 API (`ll.thespacedevs.com/2.2.0` with `lldev.thespacedevs.com/2.2.0` fallback and offline fallback dataset) backed by a 15-minute in-memory TTL cache in `schema.js`.
- **Frontend**: React 19, Apollo Client 4, and React Router 7 bundled with Vite 8 on dev port `3000` (proxying `/graphql` to `http://127.0.0.1:5001`) into `public/`. Styled with a zero-dependency **1968 NASA / JPL Flight Manual** CSS system (`0px` border-radius, welded `1px` architectural grid, live HTML5 `<canvas>` X-Y trajectory recorder, orthographic 2-stage vehicle elevation SVG schematic, `document.startViewTransition` dossier morphs, and reduced-motion controls).

## Scripts

Run all commands from the repository root:

- `npm run dev` — Run backend (`node --watch server.js` on port `5001`) and Vite frontend dev server (port `3000`) concurrently.
- `npm run build` — Build the Vite frontend into `public/`.
- `npm start` — Start the Express 5 server in production mode on port `5001`.
- `npm test` — Run GraphQL server, telemetry helper, and UI contract tests via `node --test test/*.test.js`.
