<p align="center">
  <img src="apps/zelaxy/public/Zelaxy.png" alt="Zelaxy Logo" width="84" />
</p>
<h1 align="center">🌿 Zelaxy</h1>
<p align="center">
  <b>The open-source visual platform for building, running & shipping AI agents and workflows.</b><br/>
  <sub>Drag blocks onto a canvas → wire agents, tools & logic → run with live streaming. No code required — fully extensible when you need it.</sub>
</p>

<p align="center">
  <a href="https://zelaxy.in"><b>🌐 Website</b></a> ·
  <a href="https://docs.zelaxy.in"><b>📚 Docs</b></a> ·
  <a href="#-quickstart"><b>⚡ Quickstart</b></a> ·
  <a href="#-build-anything"><b>🔬 Examples</b></a> ·
  <a href="#-why-zelaxy"><b>🌸 Why Zelaxy</b></a> ·
  <a href="https://github.com/manu14357/Zelaxy/issues"><b>🐛 Issues</b></a> ·
  <a href="#-contributing"><b>🤝 Contributing</b></a>
</p>

<p align="center">
  <a href="https://github.com/manu14357/Zelaxy/actions/workflows/ci.yml"><img src="https://github.com/manu14357/Zelaxy/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/manu14357/Zelaxy/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/manu14357/Zelaxy/stargazers"><img src="https://img.shields.io/github/stars/manu14357/Zelaxy?style=flat&logo=github&color=EA580C" alt="GitHub Stars" /></a>
  <a href="https://github.com/manu14357/Zelaxy/commits/main"><img src="https://img.shields.io/github/last-commit/manu14357/Zelaxy?color=EA580C" alt="Last commit" /></a>
  <a href="https://github.com/manu14357/Zelaxy/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Bun-1.2-000000?logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL + pgvector" />
</p>

<p align="center">
  <b>⭐ If Zelaxy is useful to you, star the repo — it genuinely helps the project reach more builders.</b>
</p>

---

## 🌱 What is Zelaxy?

**Zelaxy** is a visual operating system for AI work. You compose workflows on a canvas out of
**blocks** — AI agents, integrations, logic, loops, sub-workflows — connect them, and a real
execution engine runs the graph with **token-by-token LLM streaming**.

It looks like a flow builder. Under the hood it's a **concurrent, topological execution engine** with
parallel branches, loops, conditional routing, sub-workflows, built-in vector search (RAG), guardrails,
and multi-provider AI orchestration — the kind of thing you'd otherwise stitch together from a dozen
scripts and services.

<div align="center">

| 🧩 **270+** blocks | 🔌 **245+** integrations | 🤖 **25+** AI providers | ⚡ **65+** triggers | 🧠 **RAG** built-in |
|:---:|:---:|:---:|:---:|:---:|

<sub>…and growing every week. 🌾</sub>

</div>

> **🍃 Build workflows, not glue code.** Drag three blocks onto the canvas, connect them, hit run.

---

## 🤖 Bring your own AI — 25+ providers, one canvas

Chain frontier labs, blazing-fast inference hosts, your own cloud, and local models — in a single pipeline.
Pick a model from a dropdown; Zelaxy handles each provider's API, auth, streaming, and quirks.

<p align="center">
  <img src="https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Anthropic-191919?logo=anthropic&logoColor=white" alt="Anthropic" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?logo=googlegemini&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/xAI_Grok-000000?logo=x&logoColor=white" alt="xAI" />
  <img src="https://img.shields.io/badge/DeepSeek-4D6BFE?logo=deepseek&logoColor=white" alt="DeepSeek" />
  <img src="https://img.shields.io/badge/Mistral-FA520F?logo=mistralai&logoColor=white" alt="Mistral" />
  <img src="https://img.shields.io/badge/Meta_Llama-0668E1?logo=meta&logoColor=white" alt="Meta" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Groq-F55036?logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Cerebras-FF5722?logoColor=white" alt="Cerebras" />
  <img src="https://img.shields.io/badge/NVIDIA_NIM-76B900?logo=nvidia&logoColor=white" alt="NVIDIA" />
  <img src="https://img.shields.io/badge/AWS_Bedrock-232F3E?logo=amazonwebservices&logoColor=white" alt="AWS Bedrock" />
  <img src="https://img.shields.io/badge/Azure_OpenAI-0078D4?logo=microsoftazure&logoColor=white" alt="Azure" />
  <img src="https://img.shields.io/badge/Ollama-000000?logo=ollama&logoColor=white" alt="Ollama" />
  <img src="https://img.shields.io/badge/Hugging_Face-FFD21E?logo=huggingface&logoColor=black" alt="Hugging Face" />
  <img src="https://img.shields.io/badge/OpenRouter-6566F1?logoColor=white" alt="OpenRouter" />
  <img src="https://img.shields.io/badge/vLLM-30A2FF?logoColor=white" alt="vLLM" />
</p>

<div align="center"><sub><b>Frontier</b> OpenAI · Anthropic · Google · xAI · DeepSeek · Mistral · Meta &nbsp;·&nbsp; <b>Fast inference</b> Groq · Cerebras · Fireworks · Together · Baseten &nbsp;·&nbsp; <b>Your cloud</b> Azure OpenAI · Azure Anthropic · Bedrock · Vertex AI &nbsp;·&nbsp; <b>Open / self-hosted</b> Ollama · vLLM · LiteLLM · OpenRouter · NVIDIA · Z.ai · MiMo · Sakana</sub></div>

---

## 🔌 Connect everything — 245+ integrations

Every logo below is a real block you drag onto the canvas. Auth, API calls, and pagination are handled for you.

<p align="center">
  <img src="https://img.shields.io/badge/Slack-4A154B?logo=slack&logoColor=white" alt="Slack" />
  <img src="https://img.shields.io/badge/Gmail-EA4335?logo=gmail&logoColor=white" alt="Gmail" />
  <img src="https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=white" alt="Discord" />
  <img src="https://img.shields.io/badge/Telegram-26A5E4?logo=telegram&logoColor=white" alt="Telegram" />
  <img src="https://img.shields.io/badge/WhatsApp-25D366?logo=whatsapp&logoColor=white" alt="WhatsApp" />
  <img src="https://img.shields.io/badge/Microsoft_Teams-6264A7?logo=microsoftteams&logoColor=white" alt="Teams" />
  <img src="https://img.shields.io/badge/Twilio-F22F46?logo=twilio&logoColor=white" alt="Twilio" />
  <img src="https://img.shields.io/badge/Notion-000000?logo=notion&logoColor=white" alt="Notion" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" alt="GitHub" />
  <img src="https://img.shields.io/badge/GitLab-FC6D26?logo=gitlab&logoColor=white" alt="GitLab" />
  <img src="https://img.shields.io/badge/Jira-0052CC?logo=jira&logoColor=white" alt="Jira" />
  <img src="https://img.shields.io/badge/Linear-5E6AD2?logo=linear&logoColor=white" alt="Linear" />
  <img src="https://img.shields.io/badge/Asana-F06A6A?logo=asana&logoColor=white" alt="Asana" />
  <img src="https://img.shields.io/badge/Airtable-18BFFF?logo=airtable&logoColor=white" alt="Airtable" />
  <img src="https://img.shields.io/badge/Confluence-172B4D?logo=confluence&logoColor=white" alt="Confluence" />
  <img src="https://img.shields.io/badge/Sentry-362D59?logo=sentry&logoColor=white" alt="Sentry" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Salesforce-00A1E0?logo=salesforce&logoColor=white" alt="Salesforce" />
  <img src="https://img.shields.io/badge/HubSpot-FF7A59?logo=hubspot&logoColor=white" alt="HubSpot" />
  <img src="https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Shopify-7AB55C?logo=shopify&logoColor=white" alt="Shopify" />
  <img src="https://img.shields.io/badge/Google_Sheets-34A853?logo=googlesheets&logoColor=white" alt="Google Sheets" />
  <img src="https://img.shields.io/badge/Google_Drive-4285F4?logo=googledrive&logoColor=white" alt="Google Drive" />
  <img src="https://img.shields.io/badge/Dropbox-0061FF?logo=dropbox&logoColor=white" alt="Dropbox" />
  <img src="https://img.shields.io/badge/AWS_S3-569A31?logo=amazons3&logoColor=white" alt="S3" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Snowflake-29B5E8?logo=snowflake&logoColor=white" alt="Snowflake" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Pinecone-000000?logo=pinecone&logoColor=white" alt="Pinecone" />
  <img src="https://img.shields.io/badge/Qdrant-DC244C?logo=qdrant&logoColor=white" alt="Qdrant" />
  <img src="https://img.shields.io/badge/Redis-FF4438?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Elasticsearch-005571?logo=elasticsearch&logoColor=white" alt="Elasticsearch" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/ElevenLabs-000000?logo=elevenlabs&logoColor=white" alt="ElevenLabs" />
  <img src="https://img.shields.io/badge/YouTube-FF0000?logo=youtube&logoColor=white" alt="YouTube" />
  <img src="https://img.shields.io/badge/Reddit-FF4500?logo=reddit&logoColor=white" alt="Reddit" />
  <img src="https://img.shields.io/badge/X-000000?logo=x&logoColor=white" alt="X" />
  <img src="https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Firecrawl-F97316?logoColor=white" alt="Firecrawl" />
  <img src="https://img.shields.io/badge/%2B%20240%20more-EA580C" alt="and more" />
</p>

<div align="center"><sub>Browse the full, searchable catalog at <a href="https://docs.zelaxy.in/docs/tools"><b>docs.zelaxy.in</b></a>. 🌻</sub></div>

---

## 📑 Table of Contents

- [Why Zelaxy](#-why-zelaxy)
- [Features](#-features)
- [Build anything — example workflows](#-build-anything)
- [How it works](#-how-it-works)
- [Blocks & integrations](#-blocks--integrations)
- [Quickstart](#-quickstart)
- [Configuration](#-configuration)
- [Development](#-development)
- [Deployment](#-deployment)
- [Tech stack](#-tech-stack)
- [Contributing](#-contributing)
- [Sponsors](#-sponsors)
- [License](#-license)

---

## 🌸 Why Zelaxy

Most automation tools make you choose: **great integrations _or_ real AI _or_ open-source & self-host.**
Zelaxy is built to give you all three on one canvas.

|  | **Zelaxy** | n8n | Zapier | Flowise / Langflow |
|---|:---:|:---:|:---:|:---:|
| Open source & self-hostable | ✅ MIT | ⚠️ fair-code | ❌ SaaS only | ✅ |
| Visual canvas builder | ✅ | ✅ | ⚠️ linear | ✅ |
| AI-native (multi-provider LLMs) | ✅ **25+ providers** | ⚠️ add-on | ⚠️ limited | ✅ |
| Built-in RAG / vector search | ✅ pgvector | ⚠️ via nodes | ❌ | ✅ |
| Real-time multi-user collaboration | ✅ | ❌ | ❌ | ❌ |
| Live token streaming while running | ✅ | ❌ | ❌ | ⚠️ |
| Guardrails (PII, hallucination, schema) | ✅ | ❌ | ❌ | ⚠️ |
| Code when you need it (JS / HTTP / MCP) | ✅ | ✅ | ⚠️ | ⚠️ |
| SDKs (TypeScript + Python) & CLI | ✅ | ⚠️ | ❌ | ⚠️ |

**Zelaxy is right for you if you want to:**

- ⚡ Automate complex AI processes **without writing a custom backend**
- 🔀 Chain **multiple LLM providers** (OpenAI, Claude, Gemini, Groq, DeepSeek, Grok, Mistral, Ollama…) in one pipeline
- 🔍 **Visually debug** — see exactly which block produced which output, and how long it took
- 📚 Build **RAG pipelines** with vector search built in — upload, embed, and query from any block
- 🪝 Trigger from **Slack, GitHub, Gmail, Stripe, Telegram**, webhooks, or cron
- 🏠 **Self-host** an open-source platform you can extend with your own blocks and tools

---

## 🚀 Features

| 🧩 **270+ blocks** | 🔌 **245+ integrations** | ⚡ **Live streaming** |
|---|---|---|
| Agents, logic, routing, loops, parallel, sub-workflows, functions, guardrails & more. | Slack, Gmail, Jira, Notion, S3, Pinecone, Snowflake, Firecrawl, ElevenLabs… hundreds of actions. | Token-by-token LLM streaming. Watch the AI think in real time. |
| 🤖 **25+ AI providers** | 🧠 **Knowledge base (RAG)** | 🪝 **65+ triggers** |
| OpenAI, Claude, Gemini, Groq, DeepSeek, Grok, Cerebras, Mistral, NVIDIA, Bedrock, OpenRouter, Ollama, vLLM… | Semantic + hybrid vector search via pgvector (HNSW cosine). Upload docs, embed, query from any block. | Webhooks, cron, Slack, GitHub, Gmail, Stripe, Telegram, Teams, Outlook, WhatsApp & more. |
| 🛡️ **Guardrails** | 🤝 **ZelaxyArena copilot** | 🔄 **Real execution engine** |
| PII detection (Presidio), hallucination scoring (RAG + LLM), JSON-schema & regex validation. | An in-app AI that builds & edits workflows from plain English, runs tools, researches the web, and manages tables. | Concurrent topological DAG, parallel branches, `for`/`forEach`/`while` loops, conditional routing, sub-workflows. |
| 👥 **Real-time collaboration** | 🔐 **Self-hosted & secure** | 🧰 **SDKs + CLI** |
| Multi-user live editing over WebSockets — live cursors, presence, and per-operation permission checks. | Bring your own keys, database, and infra. Encrypted credentials. MIT licensed. | TypeScript SDK, Python SDK, and a `zelaxy` CLI for programmatic workflows. |

---

## 🔬 Build anything

Six real, end-to-end workflows you can rebuild in minutes — each is a full walkthrough in the
**[Guides →](https://docs.zelaxy.in/docs/guides)**.

### 🔭 Deep Research Agent
> Fans out to **web + academic search in parallel**, then an agent synthesizes a **cited brief** as structured JSON.

`🗨️ Chat` → `🔀 Parallel [ Tavily · ArXiv ]` → `🤖 Agent · synthesize + cite` → `📤 Response`

<br/>

### 🎧 Customer Support Agent
> Classifies inbound email, drafts a **knowledge-grounded** reply, and escalates urgent cases — behind a **human approval** gate.

`📧 Gmail` → `🤖 Agent · classify` → `🧭 Router` → `🔴 urgent → Slack` · `🟢 normal → Knowledge + draft + 🙋 Human → Gmail` · `⚪ spam → stop`

<br/>

### 📚 RAG Knowledge Agent
> Answers strictly from **your** documents via pgvector search, with a **hallucination guardrail** that blocks ungrounded replies.

`🗨️ Chat` → `🧠 Knowledge · vector search` → `🤖 Agent · answer from passages` → `🛡️ Guardrails · grounded?` → `📤 Response`

<br/>

### ✍️ Multi-Agent Content Pipeline
> A **researcher → writer → editor** hand-off turns one topic into publish-ready copy via three specialized agents.

`📝 Topic` → `🔎 Researcher · Tavily tool` → `✍️ Writer · draft` → `🪄 Editor · fact-check` → `📤 Response`

<br/>

### 🎯 Lead Enrichment Agent
> Turns a raw email into a **scored, enriched CRM record** — enrich, qualify with an agent, then branch on the score.

`🪝 Webhook` → `🔍 Hunter / Clay · enrich` → `🤖 Agent · score fit` → `🔀 Condition ≥ 70` → `✅ CRM write` · `❌ drop`

<br/>

### 📅 Scheduled Report Agent
> On a **cron schedule**, pulls metrics, has an agent write a narrative summary, and delivers it to Slack every morning.

`⏰ Schedule · cron` → `📊 API / Supabase / Sheets` → `🤖 Agent · narrate` → `💬 Slack`

---

## 🛠 How it works

|  |  |
|---|---|
| **01 · Design** 🎨 | Drag blocks onto the canvas. Connect AI agents, APIs, databases, and services. |
| **02 · Trigger** 🪝 | Webhooks, cron schedules, or event-driven from Slack, GitHub, Gmail, Stripe & more. |
| **03 · Run & stream** ⚡ | Hit run. Watch blocks execute concurrently with real-time token streaming and per-block I/O. |

---

## 🧩 Blocks & integrations

<details>
<summary><b>Browse the block families</b> (270+ blocks across these categories)</summary>

| Category | Examples |
|----------|----------|
| **AI & reasoning** | Agent (multi-provider LLM + tools), Evaluator, Router, Vision, Image Generator, Thinking, Translate, MCP |
| **Flow control** | Condition (expression or LLM-judge), Router (LLM picks a path), Switch, Loop (`for`/`forEach`/`while`), Parallel, Wait, Human-in-the-loop |
| **Data & I/O** | Function (JavaScript), API (HTTP), Response, Starter, Variables, Workflow (sub-flows) |
| **Knowledge & memory** | Knowledge base (RAG / pgvector), Memory (key-value), Table, Mem0, Zep |
| **Safety** | Guardrails — PII (Presidio), hallucination scoring, JSON-schema & regex validation |
| **Messaging** | Slack, Discord, Telegram, WhatsApp, Gmail, Outlook, Microsoft Teams, Twilio, SMTP |
| **Productivity** | Jira, Linear, Notion, Asana, Trello, Monday, Confluence, Airtable, Google Docs/Sheets/Calendar, Excel |
| **CRM & sales** | Salesforce, HubSpot, Pipedrive, Attio, Apollo, Clay, Zendesk, Gong |
| **Databases** | PostgreSQL, MySQL, MSSQL, MongoDB, Snowflake, Supabase, ClickHouse, BigQuery, Redis, Elasticsearch |
| **Vector & storage** | Pinecone, Qdrant, S3, Google Drive, OneDrive, SharePoint, Dropbox, Box |
| **Web & browser** | Firecrawl, Jina, Stagehand (browser automation), Apify, Bright Data, HTTP |
| **Search & research** | Exa, Tavily, Perplexity, Serper, Linkup, DuckDuckGo, Wikipedia, ArXiv |
| **Voice & media** | ElevenLabs, Twilio, YouTube, Spotify, Fireflies, Image Generator, Vision |
| **Dev & DevOps** | GitHub, GitLab, Sentry, Datadog, Vercel, Cloudflare, PagerDuty, Grafana |
| **Finance** | Stripe, Square, Brex, RevenueCat, Shopify |
| **Custom** | MCP servers, Function (JS), API (HTTP), Webhooks, sub-workflows |

</details>

Full, searchable reference at **[docs.zelaxy.in](https://docs.zelaxy.in)**.

---

## ⚡ Quickstart

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

App runs at **http://localhost:3000**, docs at **http://localhost:3001**.

Prefer hosted? Try **[zelaxy.in](https://zelaxy.in)** · Docs: **[docs.zelaxy.in](https://docs.zelaxy.in)**

> **Requirements:** [Bun](https://bun.sh) ≥ 1.2 · [PostgreSQL 17](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) · at least one LLM API key.

---

## 🔧 Configuration

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (with pgvector) |
| `REDIS_URL` | Redis connection string (e.g. `rediss://…` from Upstash) |
| `BETTER_AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `ENCRYPTION_KEY` | 64-char hex string for AES-256 credential encryption |
| `INTERNAL_API_SECRET` | Internal app ↔ socket bridge secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

**LLM providers** (add any): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `XAI_API_KEY`, `CEREBRAS_API_KEY`, `NVIDIA_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`

**Local models:** `OLLAMA_URL` (default `http://localhost:11434`), plus any OpenAI-compatible base URL (vLLM, LiteLLM, LM Studio).

---

## 💻 Development

```bash
bun run dev:full          # Full dev (app + websocket + docs)
bun run dev               # App only
bun run dev:sockets       # WebSocket server only
bun run build             # Build all
bun run test              # Run tests (~900 unit tests)
bun run lint              # Lint and auto-fix (Biome)
bun run type-check        # Type check (0 errors)
```

```bash
cd apps/zelaxy && bunx drizzle-kit studio    # Database GUI
cd apps/zelaxy && bunx drizzle-kit migrate   # Run migrations
bun run start:worker                          # Background job worker (requires REDIS_URL)
```

---

## 🌐 Deployment

The Next.js app deploys to **Vercel**. Two long-running services run on **Railway**:

| Service | Config file | Start command |
|---------|-------------|---------------|
| Socket server | `railway.json` | `bun run start:sockets` |
| Background worker | `railway-worker.json` | `bun run start:worker` |

Set `NEXT_PUBLIC_SOCKET_URL` and `SOCKET_SERVER_URL` on Vercel to your Railway socket URL. Background
jobs use **BullMQ** backed by **Redis** (Upstash recommended) — set `REDIS_URL` on both Vercel and the
Railway worker.

---

## 🧱 Tech stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) · React 19 |
| **Language** | TypeScript |
| **Runtime** | Bun |
| **Database** | PostgreSQL 17 + pgvector (Drizzle ORM) |
| **Auth** | better-auth (OAuth 2.0) |
| **UI** | Tailwind CSS + shadcn/ui (Radix) · @xyflow/react |
| **State** | Zustand · TanStack Query |
| **Real-time** | Socket.IO |
| **Background jobs** | BullMQ + ioredis (Redis) |
| **Monorepo** | Turborepo + Bun workspaces |
| **Testing** | Vitest |
| **Linter / formatter** | Biome |
| **Docs** | Fumadocs (MDX) |

---

## 🤝 Contributing

Contributions are welcome — blocks, integrations, bug fixes, docs, all of it. 🌱

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Run `bun run test`, `bun run lint`, and `bun run type-check`
5. Open a pull request

New here? Look for [`good first issue`](https://github.com/manu14357/Zelaxy/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) and read [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 💖 Sponsors

Zelaxy is free and open source. Sponsors keep it that way. 🌻

<p align="center">
  <a href="https://github.com/sponsors/manu14357"><img src="https://img.shields.io/badge/Sponsor%20Zelaxy-%E2%9D%A4-ea4aaa?style=for-the-badge&logo=github-sponsors" alt="Sponsor Zelaxy" /></a>
</p>

| Tier | $/mo | Perks |
|------|------|-------|
| 💎 **Diamond** | $1,000 | Co-branding + monthly 1:1 + all below |
| 🏆 **Platinum** | $500 | Custom block icon in arena + all below |
| 🥇 **Gold** | $250 | Large logo everywhere + priority support |
| 🥈 **Silver** | $100 | Logo on README, website, docs + early access |
| 🥉 **Bronze** | $50 | Logo on README, website, and docs |
| 🙌 **Supporter** | $15 | Name + link on README, website, and docs |
| 💜 **Backer** | $5 | Name on README + website |

<!-- SPONSORS:START -->
<p align="center">
  <em>Your logo here — <a href="https://github.com/sponsors/manu14357">become a sponsor</a></em>
</p>
<!-- SPONSORS:END -->

---

## 📄 License

MIT © 2025 Zelaxy — see [LICENSE](LICENSE).

---

<p align="center">
  <b>⭐ Star Zelaxy to follow along</b> — new blocks, integrations, and features ship constantly. 🌿
</p>

<p align="center">
  <a href="https://www.star-history.com/?repos=manu14357%2FZelaxy&type=timeline&logscale=&legend=top-left">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=manu14357/Zelaxy&type=timeline&theme=dark&logscale&legend=top-left&sealed_token=ea4xZVBp_KyEaL8xDdI1524tyHq_T869Tl7hSdZSpQA1X6fUuACMVkmtpT7xPXp1ncn53V8FOcShB6Ak2tqhZkTuFtmgJDau2SoFqNpYhFVKqc3HInSNVeXeVZj8YvyElrMma8ZQV3etHQgPPLuWjvNOowgUg4oUH0wbi07BPU4QG6n4bQDZJCjyh3n0" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=manu14357/Zelaxy&type=timeline&logscale&legend=top-left&sealed_token=ea4xZVBp_KyEaL8xDdI1524tyHq_T869Tl7hSdZSpQA1X6fUuACMVkmtpT7xPXp1ncn53V8FOcShB6Ak2tqhZkTuFtmgJDau2SoFqNpYhFVKqc3HInSNVeXeVZj8YvyElrMma8ZQV3etHQgPPLuWjvNOowgUg4oUH0wbi07BPU4QG6n4bQDZJCjyh3n0" width="620" />
    </picture>
  </a>
</p>

<p align="center">
  <sub>🌱 Built for people who want to automate with AI — not write glue code.</sub>
</p>
