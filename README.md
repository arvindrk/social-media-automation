# social-media-automation

A Bun-based TypeScript monorepo for social media automation.

## Structure

```
apps/
  api/            # NestJS API server
  worker-jobs/    # Background job worker
  worker-render/  # Media rendering worker

packages/
  core-types/     # Shared TypeScript types
  core-config/    # Configuration management
  core-db/        # Database utilities
  core-llm/       # LLM client integrations
  core-queue/     # Job queue (BullMQ)
  ig-client/      # Instagram client
  media-pipeline/ # Media processing
  agents-config/  # AI agent configuration
  analytics-engine/ # Analytics
```

## Getting Started

```bash
bun install
```

## Development

```bash
bun run dev:api           # Start API server
bun run dev:worker-jobs   # Start job worker
bun run dev:worker-render # Start render worker
```

## Build

```bash
bun run build:api
```
