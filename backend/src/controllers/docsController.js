const fs = require('fs');
const { SWAGGER_SPEC_PATH } = require('../utils/swagger');

const getRawDocs = (req, res) => {
  if (!fs.existsSync(SWAGGER_SPEC_PATH)) {
    return res.status(404).json({ message: 'Swagger spec not found' });
  }
  res.setHeader('Content-Type', 'text/yaml');
  res.send(fs.readFileSync(SWAGGER_SPEC_PATH, 'utf8'));
};

module.exports = {
  getRawDocs
};
