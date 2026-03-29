# MiniMap Component

A bird's-eye view component for the Zelaxy workflow canvas, providing navigation and overview capabilities for complex workflows.

## Features

- **Interactive Navigation**: Click and drag to navigate the workflow canvas
- **Real-time Execution Status**: Visual indicators for active and pending blocks
- **Diff Mode Support**: Highlights changes when comparing workflow versions
- **Block Type Color Coding**: Different colors for triggers, tools, and blocks
- **Toggleable Display**: Show/hide functionality with smooth animations
- **Responsive Design**: Automatically hides on mobile devices
- **Accessibility**: Full ARIA support and keyboard navigation

## Color Coding

- **Light Green (#6ede87)**: Trigger blocks (starter, webhook, schedule)
- **Pink/Magenta (#ff0072)**: Tool blocks (API calls, functions, etc.)
- **Purple (#6865A5)**: Regular blocks (response, output, etc.)
- **Purple (#8B5CF6)**: Container blocks (loops)
- **Orange (#F59E0B)**: Container blocks (parallel execution)

### Execution States
- **Light Green**: Currently executing blocks
- **Orange**: Pending execution blocks
- **Gray**: Disabled blocks

### Diff Mode Colors
- **Light Green**: New blocks/edges
- **Pink/Magenta**: Deleted blocks/edges  
- **Orange**: Modified blocks/edges

## Usage

```tsx
import { MiniMap } from './components/minimap'

// Basic usage
<MiniMap />

// With custom props
<MiniMap 
  defaultOpen={false}
  pannable={true}
  zoomable={true}
  className="custom-positioning"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Additional CSS classes |
| `pannable` | `boolean` | `true` | Enable click-to-pan functionality |
| `zoomable` | `boolean` | `true` | Enable scroll-to-zoom functionality |
| `ariaLabel` | `string` | `"Workflow MiniMap"` | Accessibility label |
| `defaultOpen` | `boolean` | `true` | Initial open/closed state |

## Implementation Details

The MiniMap integrates with several stores:
- `useCurrentWorkflow()`: Access to workflow state and blocks
- `useExecutionStore()`: Real-time execution status
- `useWorkflowDiffStore()`: Diff mode highlighting

The component automatically:
- Hides when no blocks exist
- Updates colors based on execution state
- Responds to diff mode changes
- Provides smooth show/hide animations

## Responsive Behavior

- **Desktop**: Full size (200x150px)
- **Tablet**: Smaller size (150x112px)  
- **Mobile**: Hidden completely

## Accessibility

- Full keyboard navigation support
- ARIA labels for screen readers
- Tooltip descriptions for buttons
- Color-blind friendly color choices
