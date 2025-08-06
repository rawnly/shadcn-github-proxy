# Shadcn Registry Proxy

A lightweight proxy service that dynamically fetches component registry files from GitHub repositories, eliminating the need to deploy and maintain your own registry infrastructure.

## Overview

This service acts as a proxy between shadcn/ui CLI and GitHub repositories containing component registries. Instead of hosting registry files on your own server, it fetches them on-demand from GitHub's raw content URLs with intelligent caching.

## Features

- **Zero Infrastructure**: No need to deploy registry files - fetch directly from GitHub
- **Intelligent Caching**: In-memory TTL-based caching (1 hour default) with background cleanup
- **Force Refresh**: Bypass cache with `?force=true` query parameter
- **Observability**: Built-in OpenTelemetry tracing for monitoring and debugging
- **Type Safety**: Full TypeScript support with Effect schema validation

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime
- GitHub Personal Access Token with repository read permissions

### Installation

```sh
bun install
```

### Environment Setup

Create a `.env` file:

```env
GH_TOKEN=your_github_personal_access_token # Optional, higher rate limit applies if not provided
PORT=8000  # Optional, defaults to 8000
```

### Development

```sh
bun run dev
```

The service will be available at `http://localhost:8000`

## Usage

### API Endpoint

```
GET /:owner/:repo/:filepath.json
```

**Parameters:**

- `owner`: GitHub repository owner
- `repo`: GitHub repository name
- `filepath`: Path to the JSON file (must end with `.json`)

**Query Parameters:**

- `force`: Set to `true` or `1` to bypass cache and fetch fresh content

### Example

```bash
# Fetch a component registry file
curl https://gh-registry.untitled.dev/shadcn-ui/registry-template/hello-world.json

# Force refresh (bypass cache)
curl https://gh-registry.untitled.dev/shadcn-ui/registry-template/hello-world.json?force=true

# nested files
curl https://gh-registry.untitled.dev/origin-space/originui/legacy/accordion.json
```

## Architecture

Built with modern TypeScript and functional programming principles:

- **Runtime**: Bun with TypeScript
- **HTTP Framework**: Hono for lightweight, fast routing
- **FP Library**: Effect for dependency injection and error handling
- **Observability**: OpenTelemetry with OTLP trace export
- **Code Quality**: Biome for formatting and linting

### File Structure

- `src/index.ts` - Main HTTP server with routing and caching logic
- `src/github.ts` - GitHub API integration service
- `src/cache.ts` - TTL-based in-memory cache implementation
- `src/schema.ts` - Type-safe data validation schemas
- `src/otel.ts` - OpenTelemetry configuration

## Configuration

The service looks for registry files in the `public/r/` directory of target repositories. This path is currently hardcoded but can be modified in `src/github.ts`.

### Code Quality

```sh
# Format code
bunx biome format .

# Lint code
bunx biome lint .

# Check both formatting and linting
bunx biome check .
```

## Deployment

The service can be deployed to any platform supporting Bun:

1. Set the `GH_TOKEN` environment variable (optional but highly recommended)
2. Optionally set `PORT` (defaults to 8000)
3. Run `bun run dev` or build for production

## License

MIT
