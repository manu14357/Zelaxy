---
name: blocks-and-tools
description: 'Create, modify, and debug block definitions and tool integrations. Use for: BlockConfig, ToolConfig, SubBlock types, block registry, tool parameters, OAuth tools, MCP tools, adding new blocks or tools, workflow block architecture.'
---

# Blocks & Tools Skill — Zelaxy

## Purpose
Create, modify, and debug block definitions and tool integrations.

## When to Use
- Creating a new block (AI agent, integration, logic, custom)
- Creating a new tool (API integration)
- Modifying block configuration or UI
- Debugging tool execution failures
- Adding OAuth support to a tool

## Blocks Architecture

### Location
- Definitions: `apps/zelaxy/blocks/blocks/` (78 files)
- Types: `apps/zelaxy/blocks/types.ts`
- Registry: `apps/zelaxy/blocks/registry.ts`
- Utilities: `apps/zelaxy/blocks/utils.ts`

### BlockConfig Interface

```typescript
interface BlockConfig {
  type: string                        // Unique identifier
  toolbar: {
    title: string
    description: string
    category: string                  // 'ai' | 'logic' | 'integration' | etc.
    bgColor: string
    icon: React.ComponentType
  }
  subBlocks: SubBlockConfig[][]       // 2D array (rows × columns)
  outputs: OutputConfig
  tools?: ToolReference[]             // Tools this block can use
  hideExecution?: boolean
}
```

### SubBlock Types (31 total)

| Type | Purpose | Key Props |
|------|---------|-----------|
| `short-input` | Single-line text | placeholder, password |
| `long-input` | Multi-line text | placeholder, rows |
| `code` | Code editor | language, placeholder |
| `dropdown` | Select one option | options |
| `combobox` | Searchable select | options, multiSelect |
| `slider` | Numeric range | min, max, step |
| `switch` / `toggle` | Boolean | — |
| `table` | Key-value or multi-column | columns |
| `file-upload` | File attachment | accept, maxSize |
| `date-input` | Date picker | — |
| `time-input` | Time picker | — |
| `checkbox-list` | Multi-select | options |
| `oauth-input` | OAuth connection | provider |
| `tool-input` | Tool selector | — |
| `condition-input` | Boolean expression | — |
| `webhook-config` | Webhook setup | — |
| `trigger-config` | Trigger configuration | — |
| `knowledge-base-selector` | KB picker | — |
| `json-input` | JSON editor | — |
| `color-input` | Color picker | — |

### Conditional Visibility

Sub-blocks can show/hide based on other field values:
```typescript
{
  type: 'short-input',
  id: 'customUrl',
  label: 'Custom URL',
  condition: { field: 'provider', value: 'custom' }  // Only shows when provider = 'custom'
}
```

### Wand Configuration (AI Assistance)

```typescript
{
  type: 'long-input',
  id: 'systemPrompt',
  label: 'System Prompt',
  wand: {
    prompt: 'Generate a system prompt for: <user_description>',
    variables: ['user_description']   // UI prompts user for these
  }
}
```

### How to Create a New Block

1. **Create definition** in `blocks/blocks/my-block.ts`:
```typescript
import type { BlockConfig } from '../types'
import { MyIcon } from '@/components/icons'

export const myBlockConfig: BlockConfig = {
  type: 'my-block',
  toolbar: {
    title: 'My Block',
    description: 'Description of what it does',
    category: 'integration',
    bgColor: '#3B82F6',
    icon: MyIcon,
  },
  subBlocks: [
    [
      { type: 'short-input', id: 'apiKey', label: 'API Key', password: true },
    ],
    [
      { type: 'dropdown', id: 'action', label: 'Action', options: [
        { label: 'Create', value: 'create' },
        { label: 'Read', value: 'read' },
      ]},
    ],
    [
      { type: 'long-input', id: 'body', label: 'Body', condition: { field: 'action', value: 'create' } },
    ],
  ],
  outputs: {
    response: { type: { data: 'any', status: 'number' } },
  },
}
```

2. **Register** in `blocks/registry.ts`:
```typescript
import { myBlockConfig } from './blocks/my-block'
// Add to the registry object
```

3. **Create handler** in `executor/handlers/my-handler.ts`
4. **Write tests**

---

## Tools Architecture

### Location
- Implementations: `apps/zelaxy/tools/` (80+ tools)
- Types: `apps/zelaxy/tools/types.ts`
- Registry: `apps/zelaxy/tools/registry.ts`
- Utilities: `apps/zelaxy/tools/utils.ts`
- Execution: `apps/zelaxy/tools/index.ts`

### ToolConfig Interface

```typescript
interface ToolConfig<P extends Record<string, any>, R = any> {
  id: string
  name: string
  description: string
  version: string
  params: Record<keyof P, ToolParameter>
  request: {
    url: string | ((params: P) => string)
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string> | ((params: P) => Record<string, string>)
    body?: ((params: P) => any)
  }
  transformResponse?: (response: any, params: P) => R
  directExecution?: (params: P, credentials?: any) => Promise<ToolResponse<R>>
}
```

### ToolParameter

```typescript
interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  default?: any
  enum?: string[]
  visibility: 'user-or-llm' | 'user-only' | 'llm-only' | 'hidden'
}
```

### Parameter Visibility Rules
- `user-or-llm`: Shown in block UI AND available to LLM tool calls
- `user-only`: Only in block UI (e.g., API keys)
- `llm-only`: Only for LLM (e.g., search queries the AI generates)
- `hidden`: Internal parameters (e.g., computed values)

### Tool Response

```typescript
interface ToolResponse<R = any> {
  success: boolean
  output: R
  error?: string
  timing: {
    startTime: number
    endTime: number
    duration: number
  }
}
```

### OAuth Tools Pattern

Tools requiring OAuth:
1. User connects via OAuth in the UI (`oauth-input` sub-block)
2. Credentials stored encrypted in `credential` table
3. At execution, handler fetches credentials from DB
4. Token refresh handled transparently

```typescript
// In handler:
const creds = await getCredentials(block.credentialId)
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${creds.accessToken}` }
})
```

### MCP Tools

Model Context Protocol tools are routed differently:
```typescript
// tools/index.ts
export async function executeMCPTool(serverId: string, toolName: string, args: any) {
  const connection = MCPService.getConnection(serverId)
  return connection.callTool(toolName, args)
}
```

### How to Create a New Tool

1. **Create tool** in `tools/my-service/my-tool.ts`:
```typescript
import type { ToolConfig } from '../types'

interface MyParams {
  query: string
  limit: number
}

export const myTool: ToolConfig<MyParams> = {
  id: 'my-service_search',
  name: 'My Service Search',
  description: 'Search items in My Service',
  version: '1.0.0',
  params: {
    query: {
      type: 'string',
      description: 'Search query',
      required: true,
      visibility: 'user-or-llm',
    },
    limit: {
      type: 'number',
      description: 'Max results',
      required: false,
      default: 10,
      visibility: 'user-only',
    },
  },
  request: {
    url: (params) => `https://api.myservice.com/search?q=${encodeURIComponent(params.query)}&limit=${params.limit}`,
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
    }),
  },
  transformResponse: (response) => ({
    results: response.items,
    total: response.total_count,
  }),
}
```

2. **Register** in `tools/registry.ts`
3. **Link to block** via `tools` field in BlockConfig
4. **Write tests**

## Common Issues
- **Missing tool registration**: Tool exists but not in `registry.ts`
- **OAuth token expiry**: Ensure refresh logic works; check `expiresAt` field
- **Rate limiting**: Some providers rate limit; implement exponential backoff
- **Large responses**: Use `transformResponse` to extract only needed fields
- **File handling**: Use dynamic import for `FileToolProcessor` to avoid client bundling
