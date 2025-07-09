# AWS Copilot JSON Schemas

This directory contains comprehensive JSON Schemas for validating AWS Copilot manifest files.

## 🌐 Hosted Schemas

These schemas are automatically deployed to GitHub Pages and available at:
**https://sootyowl.github.io/aws-copilot-schemas/**

## 📋 Available Schemas

### Main Schema
- **`copilot-schema.json`** - Universal schema that auto-detects and validates any Copilot manifest type

### Service Schemas  
- **`backend-service.json`** - Backend Service manifests
- **`lb-web-service.json`** - Load Balanced Web Service manifests
- **`rd-web-service.json`** - Request-Driven Web Service manifests
- **`worker-service.json`** - Worker Service manifests

### Other Manifest Types
- **`environment.json`** - Environment manifests
- **`scheduled-job.json`** - Scheduled Job manifests
- **`static-site.json`** - Static Site manifests
- **`pipeline.json`** - Pipeline manifests

### Shared Definitions
- **`common-definitions.json`** - Shared definitions used across all schemas

## 🚀 Quick Start

### VS Code Integration
Add this to your VS Code settings:
```json
{
  "yaml.schemas": {
    "https://sootyowl.github.io/aws-copilot-schemas/copilot-schema.json": [
      "**/copilot/**/manifest.yml",
    ]
  }
}
```

### Direct Schema Reference
Add this to your YAML manifest files:
```yaml
# yaml-language-server: $schema=https://sootyowl.github.io/aws-copilot-schemas/copilot-schema.json
```

## ✨ Features

- ✅ Complete validation for all AWS Copilot manifest types
- ✅ Auto-detection of manifest type (no manual specification needed)
- ✅ Strict adherence to [AWS Copilot documentation](https://aws.github.io/copilot-cli/docs/manifest/overview/)
- ✅ Comprehensive error reporting
- ✅ VS Code IntelliSense and validation support
- ✅ SchemaStore compatible with proper documentation URLs
- ✅ Support for all service types, environments, jobs, and pipelines

## 🔧 Local Development

To validate schemas locally:
```bash
npm test        # Validate using individual schemas
npm run validate # Validate using top-level schema
```
