---
name: ui-components
description: 'Build, modify, and style UI components. Use for: shadcn/ui Radix components, Tailwind CSS, React Flow workflow canvas, custom nodes/edges, zelaxy-orange theme, dark mode, cn() utility, Button variants, Zustand store integration.'
---

# UI Components Skill — Zelaxy

## Purpose
Build, modify, and style UI components following Zelaxy conventions.

## When to Use
- Creating new UI components
- Modifying existing components
- Styling with Tailwind CSS
- Working with shadcn/ui (Radix) primitives
- Building workflow canvas elements
- Working with @xyflow/react (React Flow)

## Stack
- **Framework**: React 19 (Next.js 15 App Router)
- **UI Library**: shadcn/ui (Radix primitives)
- **Styling**: Tailwind CSS 4+ (class-based dark mode)
- **Icons**: Custom SVG icons (`components/icons/`)
- **Canvas**: @xyflow/react 12.10.2
- **State**: Zustand

## Component Locations

```
apps/zelaxy/components/
├── ui/                     # shadcn/ui primitives (30+ components)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── popover.tsx
│   ├── sheet.tsx
│   ├── sidebar.tsx
│   ├── tabs.tsx
│   ├── accordion.tsx
│   └── ...
├── icons/                  # 80+ SVG icon components
├── emails/                 # Email templates
└── branded-layout.tsx      # Shared layout wrapper
```

### App-specific components
```
apps/zelaxy/app/arena/[workspaceId]/zelaxy/[workflowId]/components/
├── workflow-block/         # Block node component (React Flow)
├── workflow-edge/          # Edge/connection component (React Flow)
├── subflows/               # Loop & parallel node wrappers
├── control-bar/            # Top toolbar (run, deploy, settings)
└── sidebar/                # Block picker, settings
```

## Theme

### Colors (Tailwind)
```
Primary: zelaxy-orange (#F97316) — 50-900 palette
Background: hsl(var(--background))
Foreground: hsl(var(--foreground))
Card: hsl(var(--card))
Muted: hsl(var(--muted))
Accent: hsl(var(--accent))
Destructive: hsl(var(--destructive))
Border: hsl(var(--border))
Ring: hsl(var(--ring))
Success: green
```

### Font
```
Inter (primary) + system fallback
```

### Dark Mode
```
Class-based: <html class="dark">
Use `dark:` prefix for dark variants
```

## Component Patterns

### shadcn/ui Usage
```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function MyComponent() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        <Input placeholder="Enter value" />
        <Button variant="default">Submit</Button>
      </DialogContent>
    </Dialog>
  )
}
```

### Button Variants
```tsx
<Button variant="default" />     // Primary (orange)
<Button variant="secondary" />   // Muted
<Button variant="destructive" /> // Red
<Button variant="outline" />     // Border only
<Button variant="ghost" />       // No background
<Button variant="link" />        // Text link
<Button size="sm" />             // Small
<Button size="lg" />             // Large
<Button size="icon" />           // Square icon button
```

### React Flow Nodes (Workflow Canvas)

Block nodes extend React Flow's `NodeProps`:
```tsx
import { NodeProps, Handle, Position } from '@xyflow/react'

function WorkflowBlockNode({ data, selected }: NodeProps) {
  // IMPORTANT: data is typed as Record<string, unknown>
  // You must cast properties:
  const width = data.width as number
  const height = data.height as number
  const config = data.config as BlockConfig
  const hasError = !!data.hasNestedError  // Use !! for boolean coercion

  return (
    <div style={{ width, height }}>
      <Handle type="target" position={Position.Top} />
      {/* Block content */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

### React Flow Edges

```tsx
import { EdgeProps, getBezierPath } from '@xyflow/react'

function WorkflowEdge({ sourceX, sourceY, targetX, targetY, data }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY })

  // Cast SVG attributes explicitly
  const strokeLinecap = 'round' as 'round' | 'butt' | 'square'
  const strokeLinejoin = 'round' as 'round' | 'bevel' | 'miter'

  // Cast data callbacks
  const onDelete = data?.onDelete as ((id: string) => void) | undefined

  return <path d={edgePath} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} />
}
```

## Styling Rules

### Do
- Use Tailwind utility classes
- Use CSS variables for theme colors: `bg-background`, `text-foreground`
- Use `cn()` utility for conditional classes (from `@/lib/utils`)
- Use `dark:` variants for dark mode
- Use responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

### Don't
- No inline `style={{}}` except for dynamic values (width, height from data)
- No CSS modules (project uses Tailwind exclusively)
- No `ease-[cubic-bezier(...)]` — use `[transition-timing-function:cubic-bezier(...)]` instead
- No `!important` — restructure specificity instead

### cn() Utility
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'rounded-lg border p-4',
  isActive && 'border-primary bg-primary/10',
  isError && 'border-destructive',
  className
)} />
```

## Zustand Store Integration

```tsx
import { useWorkflowStore } from '@/stores/workflows'

function MyComponent() {
  const { workflows, addWorkflow } = useWorkflowStore()
  // ...
}
```

### Store Pattern
```typescript
import { create } from 'zustand'

interface MyStore {
  items: Item[]
  addItem: (item: Item) => void
  removeItem: (id: string) => void
}

export const useMyStore = create<MyStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
}))
```

## Common Issues
1. **@xyflow/react `unknown` types**: Always cast `data` properties from `NodeProps`/`EdgeProps`
2. **Hydration mismatch**: Use `useEffect` for client-only state, or `'use client'` directive
3. **Tailwind ambiguous classes**: Use arbitrary property syntax `[property:value]` for complex values
4. **Dark mode flash**: Ensure `class="dark"` is set before hydration (via script in `<head>`)
5. **Large component files**: Split into smaller sub-components, co-locate in a directory
