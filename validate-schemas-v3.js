#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const yaml = require('js-yaml');

// Function to deeply clone an object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Function to recursively flatten all $ref references in a schema
function flattenSchema(schema, commonDefs, resolvedCache = new Map()) {
    // Use cache to avoid infinite recursion
    const schemaKey = JSON.stringify(schema);
    if (resolvedCache.has(schemaKey)) {
        return resolvedCache.get(schemaKey);
    }

    if (Array.isArray(schema)) {
        const result = schema.map(item => flattenSchema(item, commonDefs, resolvedCache));
        resolvedCache.set(schemaKey, result);
        return result;
    }

    if (typeof schema === 'object' && schema !== null) {
        if (schema.$ref && typeof schema.$ref === 'string') {
            let refTarget = null;

            // Handle different reference patterns
            if (schema.$ref.startsWith('./common-definitions.json#/$defs/')) {
                const refPath = schema.$ref.split('#/$defs/')[1];
                refTarget = navigateToRef(commonDefs.$defs, refPath);
            } else if (schema.$ref.startsWith('#/$defs/')) {
                const refPath = schema.$ref.split('#/$defs/')[1];
                refTarget = navigateToRef(commonDefs.$defs, refPath);
            }

            if (refTarget) {
                // Recursively flatten the target
                const flattened = flattenSchema(refTarget, commonDefs, resolvedCache);
                resolvedCache.set(schemaKey, flattened);
                return flattened;
            } else {
                console.warn(`Warning: Could not resolve reference ${schema.$ref}`);
                return schema;
            }
        }

        const result = {};
        for (const [key, value] of Object.entries(schema)) {
            result[key] = flattenSchema(value, commonDefs, resolvedCache);
        }
        resolvedCache.set(schemaKey, result);
        return result;
    }

    return schema;
}

// Helper function to navigate to a reference path
function navigateToRef(defs, refPath) {
    const pathParts = refPath.split('/');
    let current = defs;

    for (const part of pathParts) {
        if (current && current[part]) {
            current = current[part];
        } else {
            return null;
        }
    }

    return current;
}

const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
    allowUnionTypes: true
});

// Load all schemas
const schemasDir = path.join(__dirname, 'schemas');
const schemas = {};

// Load common definitions first
const commonDefsPath = path.join(schemasDir, 'common-definitions.json');
const commonDefs = JSON.parse(fs.readFileSync(commonDefsPath, 'utf8'));

// Load and completely flatten individual schemas
const schemaFiles = [
    'backend-service.json',
    'lb-web-service.json',
    'rd-web-service.json',
    'scheduled-job.json',
    'static-site.json',
    'worker-service.json',
    'environment.json',
    'pipeline.json'
];

schemaFiles.forEach(file => {
    const schemaPath = path.join(schemasDir, file);
    if (fs.existsSync(schemaPath)) {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

        // Completely flatten all references
        const flattenedSchema = flattenSchema(schema, commonDefs);

        schemas[file] = flattenedSchema;
    } else {
        console.warn(`Schema file not found: ${file}`);
    }
});

// Function to load and validate YAML files
function validateManifest(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const manifest = yaml.load(content);

        // Determine which schema to use based on the type or manifest structure
        let schemaFile;
        
        if (!manifest.type) {
            // Check if this is a pipeline manifest by looking for pipeline-specific fields
            if (manifest.source && manifest.stages && Array.isArray(manifest.stages)) {
                schemaFile = 'pipeline.json';
                console.log(`🔧 ${filePath} - Detected as Pipeline manifest`);
            } else {
                console.log(`⚠️  ${filePath} - Skipping (no type field and doesn't match pipeline structure)`);
                return true;
            }
        } else {
            switch (manifest.type) {
                case 'Backend Service':
                    schemaFile = 'backend-service.json';
                    break;
                case 'Load Balanced Web Service':
                    schemaFile = 'lb-web-service.json';
                    break;
                case 'Request-Driven Web Service':
                    schemaFile = 'rd-web-service.json';
                    break;
                case 'Scheduled Job':
                    schemaFile = 'scheduled-job.json';
                    break;
                case 'Static Site':
                    schemaFile = 'static-site.json';
                    break;
                case 'Worker Service':
                    schemaFile = 'worker-service.json';
                    break;
                case 'Environment':
                    schemaFile = 'environment.json';
                    break;
                default:
                    console.error(`❌ Unknown type "${manifest.type}" in ${filePath}`);
                    return false;
            }
        }

        if (!schemas[schemaFile]) {
            console.error(`❌ Schema not found for type "${manifest.type}" in ${filePath}`);
            return false;
        }

        const validate = ajv.compile(schemas[schemaFile]);
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
            const manifestType = manifest.type || 'Pipeline';
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
console.log('🔍 Validating AWS Copilot manifest schemas...\n');

const testsDir = path.join(__dirname, 'tests');
if (!fs.existsSync(testsDir)) {
    console.error('Tests directory not found!');
    process.exit(1);
}

const manifests = findManifests(testsDir);
console.log(`Found ${manifests.length} manifest files to validate\n`);

let validCount = 0;
let totalCount = 0;

for (const manifest of manifests) {
    totalCount++;
    if (validateManifest(manifest)) {
        validCount++;
    }
}

console.log(`\n📊 Results: ${validCount}/${totalCount} manifests are valid`);

if (validCount === totalCount) {
    console.log('🎉 All manifests passed validation!');
    process.exit(0);
} else {
    console.log('💥 Some manifests failed validation');
    process.exit(1);
}
