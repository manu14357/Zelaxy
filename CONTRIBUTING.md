# Contributing to Zelaxy

Thank you for your interest in contributing to Zelaxy! We welcome contributions of all kinds — bug fixes, new blocks, tool integrations, documentation improvements, and more.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.2
- [PostgreSQL 17](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector)
- [Node.js](https://nodejs.org/) >= 20
- At least one LLM API key (OpenAI, Anthropic, etc.)

### Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/Zelaxy.git
cd Zelaxy

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp apps/zelaxy/.env.example apps/zelaxy/.env.local
# Edit .env.local — set DATABASE_URL, auth secrets, and at least one LLM API key

# 4. Run database migrations
cd apps/zelaxy && bunx drizzle-kit migrate && cd ../..

# 5. Start development
bun run dev:full
```

This starts the app at `http://localhost:3000` and docs at `http://docs.localhost:3001`.

## Development Commands

```bash
bun run dev:full          # Full dev (app + websocket + docs)
bun run dev               # App only
bun run dev:sockets       # WebSocket server only
bun run build             # Build all
bun run test              # Run tests
bun run lint              # Lint and auto-fix
bun run format            # Format code
bun run type-check        # Type check
```

## Project Structure

```
Zelaxy/
├── apps/
│   ├── zelaxy/           # Main Next.js 15 application
│   │   ├── blocks/       # Block definitions
│   │   ├── tools/        # Tool implementations
│   │   ├── executor/     # Workflow execution engine
│   │   ├── triggers/     # Webhook and schedule triggers
│   │   └── ...
│   ├── docs/             # Documentation site (Fumadocs)
│   └── core/             # Shared environment config
├── packages/
│   ├── cli/              # CLI tool
│   ├── ts-sdk/           # TypeScript SDK
│   └── python-sdk/       # Python SDK
```

## How to Contribute

### Reporting Bugs

1. Search [existing issues](https://github.com/manu14357/Zelaxy/issues) first
2. Open a new issue with a clear title and description
3. Include steps to reproduce, expected behavior, and actual behavior
4. Add screenshots or logs if applicable

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the use case and expected behavior
3. Include mockups or examples if possible

### Submitting Code

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Make your changes** following our conventions (see below)
4. **Run checks**:
   ```bash
   bun run test
   bun run lint
   bun run type-check
   ```
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add new block for XYZ"
   ```
6. **Push** and open a pull request

## Code Conventions

### TypeScript

- Strict mode enabled
- Use `type` imports where possible
- Prefer `const` over `let`
- Use explicit return types for exported functions

### Formatting & Linting

- **Biome** for linting and formatting
- Run `bun run lint` before committing
- Import order: external packages first, then internal modules

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Build, CI, dependency updates |

### Testing

- Write tests with [Vitest](https://vitest.dev/)
- Place test files next to source: `index.test.ts`
- Use `vi.fn()` for mocking
- Run `bun run test` to verify

## Adding a New Block

1. Create a new file in `apps/zelaxy/blocks/blocks/`
2. Define a `BlockConfig` with inputs, outputs, and sub-blocks
3. Register it in `apps/zelaxy/blocks/registry.ts`
4. Add a handler in `apps/zelaxy/executor/handlers/`
5. Add documentation in `apps/docs/content/docs/blocks/`

## Adding a New Tool

1. Create a new file in `apps/zelaxy/tools/`
2. Define a `ToolConfig` with parameters and credentials
3. Register it in the tools index
4. Add documentation in `apps/docs/content/docs/tools/`

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Reference any related issues (`Fixes #123`)
- Ensure all checks pass (tests, lint, type-check)
- Add tests for new functionality

## Code of Conduct

Be respectful, inclusive, and constructive. We're building something together.

## Questions?

- Open a [GitHub Discussion](https://github.com/manu14357/Zelaxy/discussions)
- Check the [Documentation](https://docs.zelaxy.in)

---

Thank you for helping make Zelaxy better!
