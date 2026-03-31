---
name: documentation
description: 'Create, update, and maintain product docs. Use for: Fumadocs MDX pages, docs navigation/meta.json, block/tool/trigger pages, docs quality checks, and mandatory docs sync when features change.'
---

# Documentation Skill - Zelaxy

## Purpose
Create, update, and maintain documentation in `apps/docs`, and keep docs synchronized with product changes.

## When to Use
- Adding or updating docs pages
- Creating or revising block/tool/trigger docs
- Modifying docs navigation or page metadata
- Updating docs for any product feature change (new/changed/removed)
- Working on docs site UI/layout and rendering behavior

## Docs Site Architecture

- **Framework**: Next.js 15 + Fumadocs (`fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx`)
- **Docs app root**: `apps/docs`
- **Content source**: `apps/docs/content/docs`
- **Loader**: `apps/docs/lib/source.ts` with `baseUrl: '/docs'`
- **MDX config**: `apps/docs/source.config.ts` + `apps/docs/next.config.mjs` (`createMDX()`)
- **Docs route**: `apps/docs/app/docs/[[...slug]]/page.tsx`
- **Navigation layout**: `apps/docs/app/docs/layout.tsx`
- **Dev host**: `docs.localhost:3001` (and proxied from main app)

## Key Files

- `apps/docs/content/docs/meta.json` - top-level navigation
- `apps/docs/content/docs/blocks/meta.json` - core blocks nav
- `apps/docs/content/docs/tools/meta.json` - tools nav
- `apps/docs/content/docs/triggers/meta.json` - triggers nav
- `apps/docs/content/docs/index.mdx` - docs landing page
- `apps/docs/content/docs/blocks/index.mdx` - blocks index
- `apps/docs/content/docs/tools/index.mdx` - tools index
- `apps/docs/content/docs/triggers/index.mdx` - triggers index
- `apps/docs/mdx-components.tsx` - custom MDX rendering rules
- `apps/docs/lib/colored-icons.tsx` - colored icon plugin for page tree

## Content Structure

```
apps/docs/content/docs/
├── meta.json              # Navigation structure
├── index.mdx              # Introduction
├── blocks/                # Core block docs pages
│   ├── meta.json
│   ├── index.mdx
│   └── *.mdx
├── tools/                 # Integration docs pages
│   ├── meta.json
│   ├── index.mdx
│   └── *.mdx
└── triggers/              # Trigger docs pages
  ├── meta.json
  ├── index.mdx
  └── *.mdx
```

Top-level docs sections are expected to stay under `blocks`, `tools`, and `triggers` so docs page badges and section styling behave correctly.

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
- Page references must match MDX filenames (without extension)
- Update `meta.json` in the same change when adding/renaming/removing pages

## MDX Frontmatter

```mdx
---
title: Block Name
description: One-line description of what this block does
icon: IconName
---
```

- Required: `title`, `description`
- Usually include: `icon`
- Icon names should be valid Lucide icon names (unknown names trigger warnings in colored icon plugin)

## Writing Conventions

1. Variable references: use `{{blockName.fieldName}}` syntax
2. Use fenced code blocks with language tags
3. Prefer tables for config/inputs/outputs
4. Include practical examples and sample payloads where relevant
5. Prefer internal links as absolute docs routes (`/docs/...`) for consistency
6. Use H2/H3 for visible sections

Note on headings:
- Page title is rendered from frontmatter (`DocsTitle` in page route)
- `h1` is suppressed by `apps/docs/mdx-components.tsx`
- Do not rely on markdown `# H1` for visible headings

## Block Documentation Template

```mdx
---
title: My Block
description: Brief description
icon: BlockIcon
---

## Overview

What this block does and when to use it.

## When to Use

Decision criteria and common use cases.

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| field1 | string | Yes | What it does |
| field2 | number | No | Optional config |

## Inputs

- `{{starter.input}}` - Main input from the starter block

## Outputs

- `result` - The block's output value
- `metadata` - Additional metadata

## Examples

### Basic Usage

Description of the example.

```text
[Starter] -> [Block] -> [Response]
```

### Advanced Usage

Description of advanced patterns.
```

## Tool/Trigger Pages

For tools/triggers, also include when relevant:
- Operations table
- Auth requirements
- Provider-specific configuration
- Output schema table
- Sample request/response payloads
- Troubleshooting notes

## Mandatory Docs Sync Policy

When any feature changes, docs must be updated in the same work unless the user explicitly says to skip docs.

Treat docs updates as required for:
- New block, tool integration, or trigger
- Renamed or removed feature
- Changed config fields, defaults, auth, or output schema
- Changed execution behavior visible to users
- New major workflow patterns or user-facing UX flow changes

Minimum sync actions per feature change:
1. Update or add the feature page under `blocks`, `tools`, or `triggers`
2. Update the relevant section `meta.json`
3. Update section `index.mdx` if lists/tables/examples changed
4. Update root docs landing page if category summaries changed
5. Update cross-links referencing old names/routes

If counts/claims changed materially, also review:
- `apps/docs/app/layout.tsx` sidebar stats text
- `apps/docs/app/layout.tsx` metadata copy
- top-level `README.md` claims that mirror docs positioning

## Dev Setup

```bash
# Run docs site
cd apps/docs
bun run dev    # Starts on port 3001

# Docs type-check
bun run type-check

# Access via
# http://localhost:3001 (direct)
# http://docs.localhost:3000 (via proxy)
```

## Pre-merge Checklist

1. New/changed docs pages exist for all user-facing feature changes
2. All affected `meta.json` files are updated
3. No stale links/slugs after renames
4. Frontmatter includes valid `title` and `description`
5. Docs app runs and changed pages render correctly
6. `apps/docs` type-check passes

## Common Issues
1. Missing from nav: page exists but not listed in section `meta.json`
2. Frontmatter errors: invalid YAML or missing required fields
3. Hidden title confusion: markdown `#` heading not displayed because `h1` is overridden
4. Broken links after rename: slug changed but cross-links/meta not updated
5. Docs drift: feature behavior changed in app, but docs examples/tables still old
6. Invalid icon names: unknown icon in frontmatter logs warning and may not render as expected
7. Incomplete feature updates: code changed without docs updates in same task
