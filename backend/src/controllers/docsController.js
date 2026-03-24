const fs = require('fs');
const { resolveSwaggerSpecPath } = require('../utils/swagger');

const getRawDocs = (req, res) => {
  const specPath = resolveSwaggerSpecPath();
  if (!specPath || !fs.existsSync(specPath)) {
    return res.status(404).json({ message: 'Swagger spec not found' });
  }
  res.setHeader('Content-Type', 'text/yaml');
  res.send(fs.readFileSync(specPath, 'utf8'));
};

module.exports = {
  getRawDocs
};
