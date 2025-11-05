import { readFileSync } from 'fs';
import { join } from 'path';
import { version } from '../../package.json';
import yaml from 'js-yaml';

// Read the OpenAPI YAML specification
let swaggerSpecs: any;

try {
  let openapiSpec: string;
  
  // Try to read the file from dist directory first (for production)
  try {
    openapiSpec = readFileSync(join(__dirname, 'openapi.yaml'), 'utf8');
  } catch (distError) {
    // If not found in dist, try to read from src directory (for development and some deployment scenarios)
    try {
      openapiSpec = readFileSync(join(__dirname, '../../src/config/openapi.yaml'), 'utf8');
    } catch (srcError) {
      // If not found in either location, re-throw the dist error
      throw distError;
    }
  }
  
  // Parse the YAML content
  swaggerSpecs = yaml.load(openapiSpec) as any;
  
  // Ensure the OpenAPI version is properly set
  if (swaggerSpecs) {
    // Make sure we have the correct openapi version field
    swaggerSpecs.openapi = swaggerSpecs.openapi || '3.0.0';
    // Set version from package.json if not set in YAML
    if (!swaggerSpecs.info) {
      swaggerSpecs.info = {};
    }
    swaggerSpecs.info.version = swaggerSpecs.info.version || version;
    
    // Ensure we have the required fields
    if (!swaggerSpecs.info.title) {
      swaggerSpecs.info.title = 'Zawag Islamic Marriage Platform API';
    }
    if (!swaggerSpecs.info.description) {
      swaggerSpecs.info.description = 'API documentation for the Zawag Islamic Marriage Platform';
    }
  }
} catch (error) {
  console.error('Error parsing OpenAPI YAML:', error);
  swaggerSpecs = {
    openapi: '3.0.0',
    info: {
      title: 'Zawag Islamic Marriage Platform API',
      version: version,
      description: 'API documentation for the Zawag Islamic Marriage Platform',
    },
    paths: {}
  };
}

export default swaggerSpecs;