const express = require('express');
const { createHandler } = require('graphql-http/lib/use/express');
const cors = require('cors');
const path = require('path');
const schema = require('./schema');

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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => console.log(`server started on port ${PORT}`));
}

module.exports = app;
