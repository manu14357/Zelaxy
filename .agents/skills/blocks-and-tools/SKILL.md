---
name: blocks-and-tools
description: 'Create, modify, and debug block definitions and tool integrations. Use for: BlockConfig/SubBlockConfig updates, tools.access and tools.config mappings, serializer tool resolution, GenericBlockHandler vs specialized handlers, ToolConfig params/visibility, OAuth credential flows, MCP tool expansion, custom tools, and adding new blocks or tools safely.'
---

# Blocks & Tools Skill — Zelaxy

## Purpose
Create, modify, and debug block definitions and tool integrations.

## When to Use
- Creating a new block (AI, integration, trigger, or logic)
- Creating a new tool (internal API or external provider)
- Modifying block configuration or UI sub-block behavior
- Debugging tool execution failures (validation, auth, proxy/internal routing)
- Adding OAuth support to a tool or block
- Extending MCP support (server setup, discovery, execution)
- Debugging serialization/runtime mismatches (`tools.config.tool`, params transforms)

## Blocks Architecture

### Location
- Definitions: `apps/zelaxy/blocks/blocks/`
- Types: `apps/zelaxy/blocks/types.ts`
- Registry: `apps/zelaxy/blocks/registry.ts`
- Utilities: `apps/zelaxy/blocks/utils.ts`
- Runtime serialization: `apps/zelaxy/serializer/index.ts`
- Runtime handlers: `apps/zelaxy/executor/handlers/`

### Runtime Flow (Important)

```text
Block definition (blocks/blocks/*.ts)
  -> registry.ts lookup
  -> serializer picks config.tool + params
  -> executor chooses handler
  -> generic/api/agent handlers call executeTool(...)
  -> tools runtime routes internal/proxy/mcp/custom
```

### BlockConfig Contract (Current)

```typescript
type BlockCategory = 'blocks' | 'tools' | 'triggers'

interface BlockConfig<T extends ToolResponse = ToolResponse> {
  type: string
  name: string
  description: string
  category: BlockCategory
  longDescription?: string
  docsLink?: string
  bgColor: string
  icon: BlockIcon

  subBlocks: SubBlockConfig[]
  tools: {
    access: string[]
    config?: {
      tool: (params: Record<string, any>) => string
      params?: (params: Record<string, any>) => Record<string, any>
    }
  }

  inputs: Record<string, ParamConfig>
  outputs: Record<string, OutputFieldDefinition> & {
    visualization?: { type: 'image'; url: string }
  }

  hideFromToolbar?: boolean
  triggers?: {
    enabled: boolean
    available: string[]
  }
}
```

### SubBlock Types (Current)

```typescript
'short-input' | 'long-input' | 'dropdown' | 'combobox' | 'slider' |
'table' | 'code' | 'switch' | 'tool-input' | 'checkbox-list' |
'condition-input' | 'eval-input' | 'date-input' | 'time-input' |
'oauth-input' | 'webhook-config' | 'trigger-config' | 'schedule-config' |
'file-selector' | 'project-selector' | 'channel-selector' | 'folder-selector' |
'knowledge-base-selector' | 'knowledge-tag-filters' | 'document-selector' |
'document-tag-entry' | 'input-format' | 'response-format' | 'file-upload'
```

### SubBlock Features You Should Actually Use

- `condition` supports `field/value`, optional `not`, and optional `and` condition.
- `mode` supports `basic | advanced | both`.
- `value` allows computed defaults from current params.
- `wandConfig` enables AI-assisted generation for selected fields.
- OAuth selectors use `provider`, `serviceId`, and optional `requiredScopes`.
- Trigger UI uses `availableTriggers` and `triggerProvider`.
- Use `connectionDroppable` when input connections should be disabled for a field.

### Registry Rules

- Register every block in `blocks/registry.ts`.
- Keep registry keys aligned with `BlockConfig.type`.
- Registry is maintained in alphabetical style; preserve that order.

### Serializer + Executor Behavior

- `Serializer` determines `config.tool` via:
  - `blockConfig.tools.config.tool(params)` when present
  - fallback `blockConfig.tools.access[0]`
- `Serializer` applies default sub-block values via `subBlock.value(params)`.
- Optional pre-validation (`validateRequired = true`) checks required `user-only` tool params before run.
- `loop` and `parallel` are special-cased in serializer (subflow metadata + empty tool id).
- Executor handler order includes specialized handlers, then `GenericBlockHandler` as final fallback.
- Most provider/integration blocks run through `GenericBlockHandler`; they do not need a new executor handler.

### Specialized Handlers (When You Need One)

Current dedicated handlers:
- `agent`, `api`, `condition`, `evaluator`, `function`
- `loop`, `parallel`, `response`, `router`, `workflow`, `trigger`

If your new block has runtime semantics beyond “map params and call a tool”, add or extend a specialized handler. Otherwise, use `GenericBlockHandler`.

### How to Create a New Block

1. **Create definition** in `blocks/blocks/my-block.ts`:

```typescript
import type { BlockConfig } from '../types'
import { MyIcon } from '@/components/icons'

export const MyBlock: BlockConfig = {
  type: 'my-block',
  name: 'My Block',
  description: 'Description',
  category: 'tools',
  bgColor: '#3B82F6',
  icon: MyIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'Read', id: 'read' },
        { label: 'Write', id: 'write' },
      ],
      value: () => 'read',
    },
    {
      id: 'credential',
      title: 'Credential',
      type: 'oauth-input',
      provider: 'my-provider',
      serviceId: 'my-service',
    },
  ],
  tools: {
    access: ['my_tool_read', 'my_tool_write'],
    config: {
      tool: (params) => (params.operation === 'write' ? 'my_tool_write' : 'my_tool_read'),
      params: (params) => ({ accessToken: params.credential, ...params }),
    },
  },
  inputs: {
    operation: { type: 'string' },
    credential: { type: 'string' },
  },
  outputs: {
    result: { type: 'json', description: 'Operation result' },
  },
}
```

2. **Register** in `blocks/registry.ts` (and keep alphabetical order).
3. **Only add a new executor handler if needed** for non-standard execution semantics.
4. **Add tests** (block config tests and/or runtime tests where behavior changed).

---

## Tools Architecture

### Location
- Implementations: `apps/zelaxy/tools/`
- Types: `apps/zelaxy/tools/types.ts`
- Registry: `apps/zelaxy/tools/registry.ts`
- Execution core: `apps/zelaxy/tools/index.ts`
- Param/schema helpers: `apps/zelaxy/tools/params.ts`
- Utilities: `apps/zelaxy/tools/utils.ts`
- Tests: `apps/zelaxy/tools/*.test.ts`, `apps/zelaxy/tools/**/__test-utils__`

### ToolConfig Contract (Current)

```typescript
interface ToolConfig<P = any, R = any> {
  id: string
  name: string
  description: string
  version: string

  params: Record<string, {
    type: string
    required?: boolean
    visibility?: 'user-or-llm' | 'user-only' | 'llm-only' | 'hidden'
    default?: any
    description?: string
  }>

  outputs?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'json' | 'file' | 'file[]' | 'array' | 'object'
    description?: string
    optional?: boolean
  }>

  oauth?: {
    required: boolean
    provider: OAuthService
    additionalScopes?: string[]
  }

  request: {
    url: string | ((params: P) => string)
    method: HttpMethod | ((params: P) => HttpMethod)
    headers: (params: P) => Record<string, string>
    body?: (params: P) => Record<string, any>
  }

  postProcess?: (result, params, executeTool) => Promise<ToolResponse>
  transformResponse?: (response: Response, params?: P) => Promise<R>
}
```

### ToolResponse Shape

```typescript
interface ToolResponse {
  success: boolean
  output: Record<string, any>
  error?: string
  timing?: {
    startTime: string // ISO
    endTime: string   // ISO
    duration: number  // ms
  }
}
```

### Parameter Visibility Rules
- `user-or-llm`: Shown in block UI AND available to LLM tool calls
- `user-only`: User-provided only (never generated by LLM)
- `llm-only`: Only for LLM (e.g., computed or context-bound values)
- `hidden`: Internal/runtime-only fields (e.g., resolved access token)

### OAuth Tools Pattern

- Block uses `oauth-input` sub-block (typically `id: 'credential'`).
- Block `tools.config.params` maps credential to tool input (often `accessToken` placeholder).
- `executeTool` fetches actual token from `/api/auth/oauth/token` when `credential` is present.
- Tool receives usable token in params; keep token params `hidden`.

### MCP Tools

MCP has two layers:

- Built-in MCP tools in registry: `mcp_create_server`, `mcp_connect`, `mcp_discover_tools`, `mcp_execute_tool`.
- Dynamic MCP tools expanded at provider/agent runtime using short IDs (`mcp_<hash>_<toolName>`) and registered mapping via `registerMCPToolId(...)`.

Do not manually parse server/tool from dynamic MCP tool IDs. Use metadata registry lookups.

### Custom Tools

- Custom tool IDs use `custom_` prefix.
- Resolved via `getToolAsync` + `/api/tools/custom`.
- Executed through `/api/function/execute` with generated schema-based params.

### Tool Execution Pipeline (executeTool)

1. Resolve tool (`built-in`, `custom_*`, or dynamic `mcp_*`).
2. Validate required `user-or-llm` params after merge.
3. Resolve OAuth token when `credential` param exists.
4. Route request:
   - internal if URL starts with `/api/` or `skipProxy`
   - external through `/api/proxy`
5. Apply optional `postProcess`.
6. Process file outputs on server when execution context is available.
7. Return `ToolResponse` with timing.

### How to Create a New Tool

1. **Create tool** in `tools/my-service/my-tool.ts`:

```typescript
import type { ToolConfig } from '../types'

interface MyParams {
  query: string
  limit?: number
}

export const myTool: ToolConfig<MyParams> = {
  id: 'my-service_search',
  name: 'My Service Search',
  description: 'Search items',
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
    url: (params) => `https://api.myservice.com/search?q=${encodeURIComponent(params.query)}`,
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },
  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        results: data.items || [],
        total: data.total_count || 0,
      },
    }
  },
  outputs: {
    results: { type: 'json', description: 'Search results' },
    total: { type: 'number', description: 'Total results' },
  },
}
```

2. **Export** from `tools/my-service/index.ts` (if provider folder uses index exports).
3. **Register** in `tools/registry.ts`.
4. **Link block -> tool** via `BlockConfig.tools.access` and optional `tools.config.tool/params`.
5. **Write/update tests** (`tools/index.test.ts`, `tools/utils.test.ts`, or provider-specific tests).

## Trigger Blocks Notes

- Trigger blocks typically use `category: 'triggers'` and `tools.access: []`.
- `TriggerBlockHandler` handles:
  - blocks whose metadata category is `triggers`
  - blocks running with `triggerMode: true`
- Some tool blocks can also expose trigger capabilities via `triggers.enabled` + `available` list.

## Practical Checklists

### Add New Integration Block (Tool-backed)
1. Add `blocks/blocks/<name>.ts` with `tools.access` + `tools.config` mapping.
2. Ensure sub-block `id`s match tool parameter names where validation expects it.
3. Add block to `blocks/registry.ts`.
4. Register tool(s) in `tools/registry.ts`.
5. Verify serializer picks expected `config.tool` across operation modes.

### Add New Logic/Control Block
1. Add block definition + registry entry.
2. Decide whether existing handler covers it.
3. If not, add specialized handler and wire it in executor handler list.
4. Add serialization/execution tests.

## Common Issues
1. **Outdated BlockConfig shape**: `toolbar` and `subBlocks[][]` are obsolete in this codebase.
2. **Missing registry entry**: Block/tool compiles but never appears/executed because not registered.
3. **Wrong assumption about handlers**: Most integration blocks should use `GenericBlockHandler`, not new handlers.
4. **Param ID mismatch**: Block sub-block IDs and tool param IDs diverge, causing missing-required errors.
5. **Visibility mistakes**: Marking sensitive/runtime params as `user-or-llm` instead of `hidden`/`user-only`.
6. **OAuth wiring gaps**: Not mapping `credential` correctly or not allowing token resolution in execution.
7. **MCP ID parsing bugs**: Dynamic MCP tool IDs must use metadata mapping, not string parsing.
8. **Internal vs external routing confusion**: `/api/...` tools are direct internal calls; external calls go through proxy.
9. **Assuming blocks-catalog is runtime source**: Runtime uses `blocks/registry.ts` and code definitions.