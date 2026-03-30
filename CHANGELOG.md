# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-26

### Added

- **Workflow Engine** — Visual drag-and-drop workflow builder with real-time execution
- **Block System** — Extensible block architecture for composing AI workflows
  - Agent block, API block, Condition block, Function block, Router block
  - Loop blocks (ForEach, While) and Parallel execution blocks
- **Tool Integrations** — Built-in tools for HTTP requests, code execution, web scraping, and more
- **Trigger System** — Webhook triggers, scheduled triggers, and manual triggers
- **AI Chat Interface** — Conversational UI for interacting with AI agents and workflows
- **Arena Mode** — Side-by-side LLM comparison for testing and evaluation
- **Authentication** — Email/password, Google OAuth, and GitHub OAuth via Better Auth
- **Real-time Collaboration** — WebSocket-based live workflow editing
- **Embeddable Chat Widget** — Embed AI agents on any website via `<iframe>`
- **TypeScript SDK** — Programmatic access to Zelaxy workflows (`@zelaxy/sdk`)
- **Python SDK** — Python client for Zelaxy API (`zelaxy`)
- **CLI** — Command-line tool for managing workflows and deployments
- **Documentation Site** — Full docs powered by Fumadocs with blocks, tools, triggers, and SDK reference
- **File Uploads** — Support for image and document uploads in chat
- **Workspace Management** — Team workspaces with invite system
- **Dark Mode** — Full dark mode support across the platform

### Infrastructure

- Monorepo powered by Turborepo + Bun workspaces
- PostgreSQL with Drizzle ORM and pgvector for embeddings
- Next.js 15 with App Router and React 19
- Tailwind CSS v4 for styling
- Biome for linting and formatting
- Vitest for testing
- Vercel deployment with edge runtime support

[0.1.0]: https://github.com/manu14357/Zelaxy/releases/tag/v0.1.0
