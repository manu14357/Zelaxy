---
name: documentation
description: 'Create, update, and maintain documentation. Use for: Fumadocs MDX pages, docs site setup, block/tool/trigger documentation, meta.json navigation, MDX frontmatter, content structure.'
---

# Documentation Skill — Zelaxy

## Purpose
Create, update, and maintain documentation for the Zelaxy project.

## When to Use
- Adding or updating docs pages
- Creating block/tool/trigger documentation
- Modifying MDX content or navigation
- Working on the docs site (`apps/docs/`)

## Docs Site Architecture

- **Framework**: Fumadocs + Next.js (port 3001)
- **Config**: `apps/docs/source.config.ts` — `defineDocs({ dir: 'content/docs' })`
- **MDX**: `createMDX()` from `fumadocs-mdx/next`
- **Subdomain**: `docs.zelaxy.in` (proxied via `docs.localhost:3001` in dev)

## Content Structure

```
apps/docs/content/docs/
├── meta.json              # Navigation structure
├── index.mdx              # Introduction
├── blocks/                # 21 block pages
│   ├── meta.json
│   ├── agent.mdx
│   ├── api.mdx
│   ├── condition.mdx
│   ├── evaluator.mdx
│   ├── function.mdx
│   ├── loop.mdx
│   ├── parallel.mdx
│   ├── router.mdx
│   ├── starter.mdx
│   └── ...
├── tools/                 # Tool documentation
│   └── meta.json
└── triggers/              # Trigger documentation
    └── meta.json
```

## Navigation (`meta.json`)

```json
{
  "title": "Documentation",
  "icon": "BookOpen",
  "pages": [
    "---Getting Started---", "index",
    "---Core Blocks---", "blocks",
    "---Tool Integrations---", "tools",
    "---Triggers---", "triggers"
  ]
}
```

- Use `---Section Name---` separators for grouping in navigation
- Page references match the MDX filename (without extension)

## MDX Frontmatter

```mdx
---
title: Block Name
description: One-line description of what this block does
icon: IconName
---
```

**Required fields**: `title`, `description`
**Optional**: `icon`

## Writing Conventions

1. **Variable references**: Use `{{blockName.fieldName}}` syntax
2. **Code blocks**: Use fenced code blocks with language tags
3. **Tables**: Standard markdown tables for parameter/config docs
4. **Numbered lists**: For step-by-step instructions
5. **Internal links**: Use relative MDX paths
6. **Headings**: H2 for main sections, H3 for subsections

## Block Documentation Template

```mdx
---
title: My Block
description: Brief description
icon: BlockIcon
---

## Overview

What this block does and when to use it.

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| field1 | string | Yes | What it does |
| field2 | number | No | Optional config |

## Inputs

- `{{starter.input}}` — Main input from the starter block

## Outputs

- `result` — The block's output value
- `metadata` — Additional metadata

## Examples

### Basic Usage

Description of the example.

### Advanced Usage

Description of advanced patterns.
```

## Dev Setup

```bash
# Run docs site
cd apps/docs
bun run dev    # Starts on port 3001

# Access via
# http://localhost:3001 (direct)
# http://docs.localhost:3000 (via proxy)
```

## Common Issues
1. **Missing from nav**: Add the page reference to `meta.json`
2. **MDX parsing errors**: Check frontmatter YAML syntax (no tabs)
3. **Broken links**: Use relative paths, not absolute URLs
4. **Images**: Place in `apps/docs/public/` and reference from root
