# AWS Copilot JSON Schemas

Comprehensive JSON Schemas for validating AWS Copilot manifest files (`manifest.yml`). These schemas provide strict validation for all Copilot manifest types according to the official AWS documentation.

## 🌐 Hosted Schemas

**Live URL:** https://sootyowl.github.io/aws-copilot-schemas/

## 🚀 Quick Start

### VS Code Integration
Add this to your VS Code `settings.json`:
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
Add this to the top of your YAML manifest files:
```yaml
# yaml-language-server: $schema=https://sootyowl.github.io/aws-copilot-schemas/copilot-schema.json
```

## ✨ Features

- ✅ **Complete validation** for all AWS Copilot manifest types
- ✅ **Auto-detection** of manifest type (no manual specification needed)
- ✅ **Strict adherence** to [AWS Copilot documentation](https://aws.github.io/copilot-cli/docs/manifest/overview/)
- ✅ **Comprehensive error reporting** 
- ✅ **VS Code IntelliSense** and validation support
- ✅ **SchemaStore compatible** with proper documentation URLs
- ✅ **All manifest types supported**:
  - Backend Service
  - Load Balanced Web Service
  - Request-Driven Web Service
  - Worker Service
  - Environment
  - Scheduled Job
  - Static Site
  - Pipeline

## 📋 Available Schemas

- **`copilot-schema.json`** - **Universal schema (recommended)**
- **`backend-service.json`** - Backend Service manifests
- **`lb-web-service.json`** - Load Balanced Web Service manifests
- **`rd-web-service.json`** - Request-Driven Web Service manifests
- **`worker-service.json`** - Worker Service manifests
- **`environment.json`** - Environment manifests
- **`scheduled-job.json`** - Scheduled Job manifests
- **`static-site.json`** - Static Site manifests
- **`pipeline.json`** - Pipeline manifests
- **`common-definitions.json`** - Shared definitions

## 🔧 Development

```bash
npm test        # Validate using individual schemas
npm run validate # Validate using top-level schema
```