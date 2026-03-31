<p align="center">
  <img src="apps/zelaxy/public/Zelaxy.png" alt="Zelaxy Logo" width="80" />
</p>
<h1 align="center">✦ Z E L A X Y ✦</h1>
<p align="center">
  <sub>AI Workflow Automation — Visual · Extensible · Real-time</sub>
</p>

<p align="center">
  <img src="apps/zelaxy/app/(landing)/assets/Readme.png" alt="Zelaxy" width="100%" />
</p>

<p align="center">
  <a href="https://zelaxy.in">zelaxy.in</a> · <a href="https://docs.zelaxy.in">Docs</a> · <a href="#quickstart">Quickstart</a> · <a href="https://github.com/manu14357/Zelaxy/issues">Issues</a> · <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="https://github.com/manu14357/Zelaxy/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/manu14357/Zelaxy/stargazers"><img src="https://img.shields.io/github/stars/manu14357/Zelaxy?style=social" alt="GitHub Stars" /></a>
</p>

---

# Open-source AI workflow automation — visual, extensible, real-time

Zelaxy is a visual platform for building AI-powered automation workflows. Drag blocks onto a canvas, connect them, and watch them execute with real-time LLM streaming. No code required — but fully extensible when you need it.

It looks like a flow builder — but under the hood it has a topological execution engine, parallel branches, loops, sub-workflows, vector search, and multi-provider AI orchestration.

**Build workflows, not glue code.**

|   |   |   |
|---|---|---|
| 01 | **Design the workflow** | Drag blocks onto the canvas. Connect AI agents, APIs, databases, and services. |
| 02 | **Configure triggers** | Webhooks, cron schedules, or event-driven from Slack, GitHub, Gmail, Stripe, and more. |
| 03 | **Execute and stream** | Hit run. Watch blocks execute in order with real-time token streaming. |

---

## Zelaxy is right for you if

- ✅ You want to automate complex processes with AI — without writing a custom backend
- ✅ You need to chain multiple LLM providers (OpenAI, Claude, Gemini, Groq, DeepSeek, Grok, Ollama) in one pipeline
- ✅ You want visual debugging — see exactly which block produced what output
- ✅ You need event-driven triggers from Slack, GitHub, Gmail, Stripe, Telegram, and others
- ✅ You need RAG pipelines with vector search built-in (pgvector)
- ✅ You want AI-assisted workflow building with a copilot that generates code, schemas, and prompts
- ✅ You want an open-source platform you can self-host and extend

---

## Features

| 🧩 78 Blocks | 🔗 67+ Integrations | ⚡ Real-time Streaming |
|---|---|---|
| AI agents, logic, routing, loops, parallel, sub-workflows, functions, and more. | Slack, Gmail, Jira, Notion, S3, Pinecone, Snowflake, Firecrawl, ElevenLabs, and more. | Token-by-token LLM streaming. Watch AI think in real-time. |
| 🤖 Multi-Provider AI | 🧠 Knowledge Base (RAG) | 🎯 10 Trigger Types |
| OpenAI, Claude, Gemini, Groq, DeepSeek, Grok, Cerebras, Mistral, Ollama, LM Studio. | Vector search via pgvector. Upload docs, embed, and query from any block. | Webhooks, cron, Slack, GitHub, Gmail, Stripe, Telegram, Teams, Outlook, WhatsApp. |
| 🛡️ Guardrails | 🤝 AI Copilot (Agie) | 🔄 Workflow Engine |
| PII detection, hallucination checks, JSON schema validation. Safety built-in. | RAG-powered assistant. Generates code, schemas, system prompts. AI Wand for natural language. | Topological sorting, parallel branches, forEach/for loops, conditional routing, sub-workflows. |

---

## Problems Zelaxy solves

|   |   |
|---|---|
| ❌ You write custom glue code every time you need to chain an LLM with an API call and a database query. | ✅ Drag three blocks onto the canvas, connect them, done. |
| ❌ You switch between OpenAI, Claude, and Gemini dashboards to compare outputs. | ✅ One workflow, multiple AI providers. Compare side-by-side in the same pipeline. |
| ❌ You manually set up webhooks, cron jobs, and event listeners for each integration. | ✅ 10 trigger types built-in. Click to configure. |
| ❌ Your RAG pipeline is scattered across scripts, notebooks, and services. | ✅ Knowledge base with pgvector built into the platform. Upload, embed, query — all from the canvas. |
| ❌ You can't see why a workflow failed or which step produced bad output. | ✅ Every block shows its input, output, and execution time. Visual debugging. |
| ❌ You need to build separate admin UIs for non-technical team members. | ✅ Visual interface. Anyone can build and monitor workflows. |

---

## Blocks

| Category | Examples |
|----------|---------|
| **AI Agents** | OpenAI, Claude, Gemini, Groq, DeepSeek, Grok, Cerebras, HuggingFace, Perplexity, Mistral, Thinking, Vision |
| **Core Logic** | Condition, Router, Evaluator, Function, API, Loop, Parallel, Response |
| **Messaging** | Slack, Discord, Telegram, WhatsApp, Gmail, Outlook, Microsoft Teams, SMTP |
| **Productivity** | Jira, Linear, Notion, Google Docs, Google Calendar, Google Sheets, Excel, Planner, Confluence, Airtable |
| **Data & Search** | Pinecone, Qdrant, Supabase, Wikipedia, ArXiv, Reddit, Serper, Tavily, Exa, Linkup |
| **Storage** | S3, Google Drive, OneDrive, SharePoint |
| **Databases** | Snowflake, MSSQL, Google Sheets, Excel |
| **Web & Browser** | Firecrawl, Jina, Stagehand (browser automation), HTTP |
| **Voice & Media** | ElevenLabs, Twilio SMS, Translate, Image Generator, YouTube, Vision |
| **Knowledge & Memory** | Knowledge base (RAG), Memory (key-value), Mem0 |
| **Safety** | Guardrails (PII detection, hallucination checks, JSON schema validation) |
| **Custom** | MCP servers, Function (JavaScript), API (HTTP), Webhooks, Workflow (sub-flows) |

---

## Quickstart

Open source. Self-hosted. No account required.

```bash
git clone https://github.com/manu14357/Zelaxy.git
cd Zelaxy
bun install
cp apps/zelaxy/.env.example apps/zelaxy/.env.local
# Edit .env.local — set DATABASE_URL, auth secrets, and at least one LLM API key
cd apps/zelaxy && bunx drizzle-kit migrate && cd ../..
bun run dev:full
```

This starts the app at `http://localhost:3000` and docs at `http://localhost:3001`.

Hosted: **[zelaxy.in](https://zelaxy.in)** · Docs: **[docs.zelaxy.in](https://docs.zelaxy.in)**

> **Requirements:** [Bun](https://bun.sh) >= 1.2, [PostgreSQL 17](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector), at least one LLM API key.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `ENCRYPTION_KEY` | 64-char hex string for AES-256 |
| `INTERNAL_API_SECRET` | Internal API secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

**LLM providers** (add any): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `XAI_API_KEY`, `CEREBRAS_API_KEY`, `NVIDIA_API_KEY`, `MISTRAL_API_KEY`

**Local models:** `OLLAMA_URL` (default `http://localhost:11434`), `LM_STUDIO_URL` (default `http://localhost:1234`)

---

## Development

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

```bash
cd apps/zelaxy && bunx drizzle-kit studio    # Database GUI
cd apps/zelaxy && bunx drizzle-kit migrate   # Run migrations
cd apps/zelaxy && bunx trigger.dev@latest dev # Background jobs
```

---

## Deployment

The Next.js app deploys to **Vercel**. The Socket.IO server deploys separately to **Railway** (configured via `railway.json`). Set `NEXT_PUBLIC_SOCKET_URL` and `SOCKET_SERVER_URL` on Vercel to your Railway URL.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, React 19) |
| **Language** | TypeScript |
| **Runtime** | Bun |
| **Database** | PostgreSQL 17 + pgvector (Drizzle ORM) |
| **Auth** | better-auth (OAuth 2.0) |
| **UI** | Tailwind CSS + shadcn/ui (Radix) |
| **State** | Zustand |
| **Real-time** | Socket.io |
| **Background Jobs** | Trigger.dev |
| **Monorepo** | Turborepo + Bun workspaces |
| **Testing** | Vitest |
| **Linter** | Biome |
| **Docs** | Fumadocs (MDX) |

---

## Project Structure

```
Zelaxy/
├── apps/
│   ├── zelaxy/           # Main Next.js 15 application
│   │   ├── app/          # App Router — pages, API routes, layouts
│   │   ├── blocks/       # 78 block definitions
│   │   ├── tools/        # 67+ tool implementations
│   │   ├── executor/     # Workflow execution engine
│   │   ├── triggers/     # Webhook and schedule triggers
│   │   ├── lib/          # Utilities, copilot, auth
│   │   ├── db/           # Drizzle ORM schema and migrations
│   │   ├── components/   # UI components (shadcn/ui)
│   │   ├── stores/       # Zustand state management
│   │   ├── services/     # MCP server, queue management
│   │   └── socket-server/# WebSocket server (Socket.io)
│   ├── docs/             # Documentation site (Fumadocs)
│   └── core/             # Shared environment config
├── packages/             # CLI, TypeScript SDK, Python SDK
├── LICENSE               # MIT License
└── package.json          # Monorepo root
```

---

## Contributing

We welcome contributions. See how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run `bun run test` and `bun run lint`
5. Open a pull request

---

## License

MIT © 2025 Zelaxy

---

<a href="https://star-history.com/#manu14357/Zelaxy&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=manu14357/Zelaxy&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=manu14357/Zelaxy&type=Date" />
    <img src="https://api.star-history.com/svg?repos=manu14357/Zelaxy&type=Date" alt="Star History Chart" width="600" />
  </picture>
</a>

<p align="center">
  Open source under MIT. Built for people who want to automate with AI, not write glue code.
</p>
