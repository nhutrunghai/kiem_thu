const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SWAGGER_SPEC_PATH = path.join(__dirname, '..', '..', '..', 'swagger.yaml');

const loadSwaggerSpec = () => {
  if (!fs.existsSync(SWAGGER_SPEC_PATH)) return null;
  try {
    const raw = fs.readFileSync(SWAGGER_SPEC_PATH, 'utf8');
    return yaml.load(raw);
  } catch (e) {
    console.error('Failed to load swagger spec:', e.message);
    return null;
  }
};

module.exports = {
  SWAGGER_SPEC_PATH,
  loadSwaggerSpec
};
