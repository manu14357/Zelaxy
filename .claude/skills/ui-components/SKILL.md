---
name: ui-components
description: 'Build, modify, and style UI components. Use for: shadcn/ui primitives, Tailwind token theming, arena and landing theme providers, React Flow workflow nodes/edges, workflow sub-block renderer components, CSS modules where used, and Zustand-driven UI state.'
---

# UI Components Skill - Zelaxy

## Purpose
Build and maintain UI in `apps/zelaxy` using the project's real component, theming, and workflow-canvas architecture.

## When to Use
- Creating or updating reusable UI primitives under `components/ui`
- Building or changing workflow canvas nodes, edges, and subflow containers
- Updating theme behavior, dark mode, and CSS tokens
- Modifying workflow sub-block input renderers
- Wiring UI to Zustand stores (panel state, execution state, workflow state)

## UI Stack

- Framework: Next.js 15 + React 19
- Styling: Tailwind CSS 3.x + `tailwindcss-animate`
- Primitive library: shadcn/ui + Radix primitives
- Variants: `class-variance-authority`
- Class merging: `cn()` from `lib/utils.ts` (`clsx` + `tailwind-merge`)
- Canvas: `@xyflow/react`
- State: Zustand stores under `stores/`

## shadcn Configuration

From `apps/zelaxy/components.json`:

- `style: default`
- `tailwind.css: app/globals.css`
- `tailwind.config: tailwind.config.ts`
- `tailwind.cssVariables: true`
- UI alias: `@/components/ui`

## Component Locations

```
apps/zelaxy/components/
├── ui/                      # reusable primitives and wrappers
├── icons/                   # provider/block/brand icon components
├── emails/
└── branded-layout.tsx
```

Arena workflow UI lives in:

```
apps/zelaxy/app/arena/[workspaceId]/zelaxy/[workflowId]/components/
├── workflow-block/
├── workflow-edge/
├── subflows/                # loop-node + parallel-node
├── minimap/
├── panel/
├── control-bar/
├── advanced-sidebar/
├── bottom-panel/
└── workflow-text-editor/
```

## Theming and Dark Mode

### Token source

Theme tokens are defined in `app/globals.css` using CSS variables under `:root` and `.dark`, including:

- core tokens: `--background`, `--foreground`, `--primary`, `--muted`, `--border`, etc.
- workflow tokens: `--workflow-background`, `--workflow-dots`, `--block-border`, `--card-*`
- surface/text hierarchy tokens near the end of the file

### Theme providers (two contexts)

1. Arena pages:
- Provider: `app/arena/[workspaceId]/providers/theme-provider.tsx`
- Source of truth: `useGeneralStore().theme` (`light | dark | system`)
- Applies `light` or `dark` class directly to `document.documentElement`

2. Landing pages:
- Provider: `app/(landing)/components/theme-provider.tsx`
- Uses local state + localStorage key (default `zelaxy-theme`)

Do not assume one global theme provider implementation across the entire app.

### React Flow color mode

Workflow and preview canvases set React Flow `colorMode` by observing the root class with `MutationObserver` and mapping to `light` or `dark`.

## Styling System

### Tailwind + global CSS roles

- Use Tailwind utility classes for component-level styling.
- Keep theme values tokenized (`bg-background`, `text-foreground`, etc.).
- Global CSS in `app/globals.css` is intentionally heavy for:
  - React Flow v12 variable overrides
  - workflow edge/handle/z-index behavior
  - theme tokens and shared utilities

### CSS Modules are allowed (limited)

CSS modules are currently used where localized styling is cleaner than utility-only markup:

- `components/minimap/minimap.module.css`
- `components/bottom-panel/bottom-panel.module.css`

Do not enforce a "no CSS modules" rule in this codebase.

### `cn()` utility

Always compose classes with `cn()` from `lib/utils.ts` when conditional classes are involved.

## shadcn and Primitive Patterns

`components/ui` uses standard shadcn patterns:

- `forwardRef` wrappers for Radix primitives
- `cva` variant definitions (button, badge, alert, sheet, toggle, label)
- barrel export via `components/ui/index.ts`

When adding a new primitive:

1. Add component file under `components/ui`
2. Export from `components/ui/index.ts`
3. Use token-based classes and `cn()` composition

## Workflow Canvas Architecture

Main file: `app/arena/[workspaceId]/zelaxy/[workflowId]/workflow.tsx`

### Node and edge type wiring

- `nodeTypes`:
  - `workflowBlock -> WorkflowBlock`
  - `loopNode -> LoopNodeComponent`
  - `parallelNode -> ParallelNodeComponent`
- `edgeTypes`:
  - `workflowEdge -> WorkflowEdge`

### Key canvas behaviors

- Uses `dragHandle: '.workflow-drag-handle'` for node dragging
- Uses `noWheelClassName='allow-scroll'` so inner inputs can scroll without zooming canvas
- Applies custom connection styles and smooth-step edge behavior
- Uses global `.workflow-container` CSS overrides for React Flow internals

### Core canvas components

- `workflow-block/workflow-block.tsx`
  - card-style node UI
  - dynamic handles for normal/condition/trigger paths
  - panel selection integration (`usePanelStore`)
  - diff highlighting support
- `workflow-edge/workflow-edge.tsx`
  - custom edge rendering with selection hit area and delete affordance
  - diff-status visual styles
- `subflows/loop/loop-node.tsx` and `subflows/parallel/parallel-node.tsx`
  - container nodes with nested drag/drop styling
  - include scoped `style jsx global` blocks for behavior-specific animation and overrides
- `minimap/minimap.tsx`
  - custom node colors by block category and execution status
  - CSS module-based shell styling

## Sub-block Renderer Architecture

Central renderer:

- `workflow-block/components/sub-block/sub-block.tsx`

This component maps `SubBlockConfig.type` to concrete renderer components under:

- `workflow-block/components/sub-block/components/`

Examples include short/long input, dropdown, combobox, condition, eval, schedule config, webhook config, OAuth credential selector, file/project/folder selector, knowledge filters, and more.

Important behaviors:

- conditional visibility (`condition`, `and`, `not`)
- mode filtering (`basic`, `advanced`, `both`)
- preview mode propagation (`isPreview`, `previewValue`, `disabled`)
- specialized MCP dropdown data loading for server/tool fields

When adding a new sub-block UI type:

1. Create renderer component under the sub-block components directory
2. Export it from that directory index file
3. Add `case` handling in `sub-block.tsx`
4. Ensure preview and disabled behavior works

## Zustand UI Integration

Common UI-facing stores in workflow UI:

- `useGeneralStore` for theme and UX settings
- `usePanelStore` for selected node and panel tabs
- `useExecutionStore` for active and pending block state
- `useWorkflowStore` and `useWorkflowRegistry` for graph and active workflow
- `useWorkflowDiffStore` for diff visualization

Guidelines:

- Prefer selector-based subscriptions for render performance.
- Use `Store.getState()` only for non-reactive reads in utility paths.
- For collaborative mutations, call collaborative hooks instead of directly mutating store when queue/ack semantics are required.

## Practical Checklists

### Add or update a UI primitive

1. Implement component in `components/ui`
2. Use tokenized Tailwind classes and `cn()`
3. Add variant API via `cva` if needed
4. Export from `components/ui/index.ts`

### Add or update a workflow canvas node

1. Update node component (`WorkflowBlock`, `LoopNodeComponent`, or `ParallelNodeComponent`)
2. Keep drag handle class and handle IDs stable unless all dependent logic is updated
3. Validate dark/light rendering against global workflow token variables
4. Verify interaction with panel selection and collaborative updates

### Add a new sub-block control

1. Add renderer component and export
2. Wire switch case in `sub-block.tsx`
3. Respect `isPreview` and `disabled`
4. Confirm canvas wheel/scroll behavior remains correct

## Testing Notes

Existing UI tests include:

- `components/ui/tag-dropdown.test.tsx`
- `components/subflows/loop/loop-node.test.tsx`
- `components/subflows/parallel/parallel-node.test.tsx`

When changing node behavior, add or update tests in the corresponding component folder.

## Common Pitfalls

1. Assuming Tailwind v4 patterns; this app uses Tailwind 3.x config/plugins.
2. Forgetting to export new primitives from `components/ui/index.ts`.
3. Treating all pages as if they share one theme provider implementation.
4. Breaking canvas drag behavior by removing or renaming `.workflow-drag-handle` without updating node config.
5. Ignoring `noWheelClassName='allow-scroll'` interactions for sub-block inputs.
6. Overriding React Flow styles in component files instead of respecting global `workflow-container` overrides.
7. Enforcing no-CSS-module rules despite active module usage in minimap and bottom panel.
8. Using broad store subscriptions that trigger unnecessary re-renders in heavy canvas components.
