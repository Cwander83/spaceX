const crypto = require('crypto');
const express = require('express');
const { createHandler } = require('graphql-http/lib/use/express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const schema = require('./schema');

const SPA_INDEX_PATH = path.resolve(__dirname, 'public', 'index.html');

function sendSpaIndex(req, res, next) {
  fs.readFile(SPA_INDEX_PATH, 'utf8', (err, html) => {
    if (err) {
      next(err);
      return;
    }

    const etag = `"${crypto
      .createHash('sha256')
      .update(html)
      .digest('hex')
      .slice(0, 16)}"`;

    res.set({
      'Cache-Control': 'no-cache, max-age=0, must-revalidate',
      ETag: etag,
    });

    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.type('html').send(html);
  });
}

const app = express();

// Allow cross-origin requests
app.use(cors());

const GRAPHIQL_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GraphiQL</title>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }
      #graphiql {
        height: 100vh;
      }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
  </head>
  <body>
    <div id="graphiql">Loading...</div>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
    <script>
      const root = ReactDOM.createRoot(document.getElementById('graphiql'));
      root.render(
        React.createElement(GraphiQL, {
          fetcher: GraphiQL.createFetcher({ url: '/graphql' }),
        }),
      );
    </script>
  </body>
</html>`;

// Serve GraphiQL 3 for interactive browser GET requests without a query parameter
app.get('/graphql', (req, res, next) => {
  if (req.accepts(['html', 'json']) === 'html' && !req.query.query) {
    res.type('html').send(GRAPHIQL_HTML);
    return;
  }
  next();
});

app.all('/graphql', createHandler({ schema }));

app.use(
  '/assets',
  express.static(path.join(__dirname, 'public', 'assets'), {
    immutable: true,
    maxAge: '1y',
  }),
  (_req, res) => {
    res.status(404).type('text/plain').send('Asset not found');
  }
);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('/', sendSpaIndex);

app.get('/{*splat}', (req, res, next) => {
  if (path.extname(req.path)) {
    res.status(404).type('text/plain').send('Not Found');
    return;
  }
  sendSpaIndex(req, res, next);
});

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => console.log(`server started on port ${PORT}`));
}

module.exports = app;
