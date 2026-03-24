const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SWAGGER_SPEC_PATHS = [
  path.join(__dirname, '..', '..', '..', 'swagger.yaml'),
  path.join(__dirname, '..', '..', 'swagger.yaml')
];

const resolveSwaggerSpecPath = () => SWAGGER_SPEC_PATHS.find(fs.existsSync) || null;

const loadSwaggerSpec = () => {
  const specPath = resolveSwaggerSpecPath();
  if (!specPath) return null;
  try {
    const raw = fs.readFileSync(specPath, 'utf8');
    return yaml.load(raw);
  } catch (e) {
    console.error('Failed to load swagger spec:', e.message);
    return null;
  }
};

module.exports = {
  SWAGGER_SPEC_PATH: SWAGGER_SPEC_PATHS[0],
  SWAGGER_SPEC_PATHS,
  resolveSwaggerSpecPath,
  loadSwaggerSpec
};
