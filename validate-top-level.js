#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const yaml = require('js-yaml');

// Create Ajv instance with proper configuration for schema composition
const ajv = new Ajv({ 
  allErrors: true, 
  verbose: true,
  strict: false,
  allowUnionTypes: true,
  loadSchema: async (uri) => {
    // Custom schema loader to resolve relative references
    console.log(`Loading schema: ${uri}`);
    
    let filePath;
    if (uri.startsWith('./')) {
      filePath = path.join(__dirname, 'schemas', uri.substring(2));
    } else if (!uri.includes('/') && uri.endsWith('.json')) {
      // Handle direct schema file names
      filePath = path.join(__dirname, 'schemas', uri);
    } else {
      throw new Error(`Unknown schema URI: ${uri}`);
    }
    
    if (fs.existsSync(filePath)) {
      const schema = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ Loaded schema: ${uri}`);
      return schema;
    } else {
      console.error(`❌ Schema file not found: ${filePath}`);
      throw new Error(`Schema not found: ${uri}`);
    }
  }
});

// Add standard formats (date, time, etc.)
addFormats(ajv);

// Function to load and validate YAML files using only the top-level schema
async function validateWithTopLevelSchema(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const manifest = yaml.load(content);
    
    // Load the top-level copilot schema
    const topLevelSchemaPath = path.join(__dirname, 'schemas', 'copilot-schema.json');
    const topLevelSchema = JSON.parse(fs.readFileSync(topLevelSchemaPath, 'utf8'));
    
    // Compile the schema with all its references
    const validate = await ajv.compileAsync(topLevelSchema);
    const valid = validate(manifest);
    
    if (!valid) {
      console.error(`\n❌ Validation failed for ${filePath}:`);
      validate.errors.forEach(error => {
        console.error(`  - ${error.instancePath || 'root'}: ${error.message}`);
        if (error.data !== undefined && typeof error.data !== 'object') {
          console.error(`    Data: ${JSON.stringify(error.data)}`);
        }
      });
      return false;
    } else {
      // Determine manifest type for reporting
      let manifestType = 'Unknown';
      if (manifest.type) {
        manifestType = manifest.type;
      } else if (manifest.source && manifest.stages) {
        manifestType = 'Pipeline';
      }
      
      console.log(`✅ ${filePath} is valid (${manifestType})`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find and validate all test manifests
function findManifests(dir) {
  const manifests = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      manifests.push(...findManifests(fullPath));
    } else if (item.endsWith('.yml') || item.endsWith('.yaml')) {
      manifests.push(fullPath);
    }
  }
  
  return manifests;
}

// Main validation
async function main() {
  console.log('🔍 Validating AWS Copilot manifests using top-level copilot-schema.json...\n');

  const testsDir = path.join(__dirname, 'tests');
  if (!fs.existsSync(testsDir)) {
    console.error('Tests directory not found!');
    process.exit(1);
  }

  const manifests = findManifests(testsDir);
  console.log(`Found ${manifests.length} manifest files to validate\n`);

  let validCount = 0;
  let totalCount = 0;

  // Validate each manifest
  for (const manifest of manifests) {
    totalCount++;
    if (await validateWithTopLevelSchema(manifest)) {
      validCount++;
    }
  }

  console.log(`\n📊 Results: ${validCount}/${totalCount} manifests are valid`);

  if (validCount === totalCount) {
    console.log('🎉 All manifests passed validation using the top-level schema!');
    process.exit(0);
  } else {
    console.log('💥 Some manifests failed validation');
    process.exit(1);
  }
}

// Run the validation
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
