const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const { loadSwaggerSpec } = require('./utils/swagger');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cors());

app.use(routes);

// Swagger UI
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const spec = loadSwaggerSpec();
  if (!spec) {
    return res.status(404).send('Swagger spec not found');
  }
  return swaggerUi.setup(spec, { customSiteTitle: 'UniFlow API Docs' })(req, res, next);
});

// --- SERVING FRONTEND FILES ---
const DIST_DIR = path.join(__dirname, '..', '..', 'frontend', 'dist');
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'frontend');

if (require('fs').existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
  });
} else {
  app.use(express.static(PUBLIC_DIR));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
    }
  });
}

module.exports = app;
