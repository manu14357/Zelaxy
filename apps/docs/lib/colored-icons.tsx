import { createElement } from 'react'
import { icons } from 'lucide-react'

/**
 * Icon color mapping based on Lucide icon name.
 * Groups icons by semantic category for vibrant sidebar rendering.
 */
const iconColorMap: Record<string, string> = {
  // AI & Logic — violet
  Bot: '#8b5cf6',
  Brain: '#8b5cf6',
  Sparkles: '#8b5cf6',
  Cpu: '#8b5cf6',
  Wand2: '#8b5cf6',
  WandSparkles: '#8b5cf6',

  // Flow Control — blue
  GitBranch: '#3b82f6',
  ArrowRightLeft: '#3b82f6',
  Route: '#3b82f6',
  Repeat: '#3b82f6',
  Layers: '#3b82f6',
  Play: '#3b82f6',
  MessageSquare: '#3b82f6',
  RotateCcw: '#3b82f6',
  Workflow: '#3b82f6',
  Split: '#3b82f6',
  Merge: '#3b82f6',
  Shuffle: '#3b82f6',

  // Code & API — emerald
  Code: '#10b981',
  Globe: '#10b981',
  Terminal: '#10b981',
  FileCode: '#10b981',
  Braces: '#10b981',
  FileJson: '#10b981',
  SquareCode: '#10b981',

  // Data & Knowledge — amber
  Database: '#f59e0b',
  BookOpen: '#f59e0b',
  HardDrive: '#f59e0b',
  Library: '#f59e0b',
  FileText: '#f59e0b',
  File: '#f59e0b',
  Shield: '#f59e0b',
  Lightbulb: '#f59e0b',
  Server: '#f59e0b',
  Container: '#f59e0b',

  // Communication — pink
  MessageCircle: '#ec4899',
  Mail: '#ec4899',
  Send: '#ec4899',
  Phone: '#ec4899',
  Video: '#ec4899',
  AtSign: '#ec4899',
  Hash: '#ec4899',

  // Search & Research — cyan
  Search: '#06b6d4',
  Compass: '#06b6d4',
  Microscope: '#06b6d4',
  BookMarked: '#06b6d4',
  ScanSearch: '#06b6d4',
  Filter: '#06b6d4',

  // Web & Scraping — orange
  Chrome: '#f97316',
  Monitor: '#f97316',
  ExternalLink: '#f97316',
  Link: '#f97316',
  Globe2: '#f97316',
  Rss: '#f97316',

  // Storage & Cloud — slate
  Cloud: '#64748b',
  Upload: '#64748b',
  Download: '#64748b',
  FolderOpen: '#64748b',
  Archive: '#64748b',
  Package: '#64748b',

  // Dev Tools — gray
  Github: '#6b7280',
  GitPullRequest: '#6b7280',
  Plug: '#6b7280',
  Settings: '#6b7280',
  Cog: '#6b7280',
  Wrench: '#6b7280',

  // Triggers — red
  Webhook: '#ef4444',
  Zap: '#ef4444',
  Timer: '#ef4444',
  Clock: '#ef4444',
  Calendar: '#ef4444',
  Bell: '#ef4444',
  BellRing: '#ef4444',

  // Productivity — indigo
  ListTodo: '#6366f1',
  CheckSquare: '#6366f1',
  ClipboardList: '#6366f1',
  Table: '#6366f1',
  Columns: '#6366f1',
  Sheet: '#6366f1',
  LayoutGrid: '#6366f1',
  KanbanSquare: '#6366f1',

  // Media — rose
  Image: '#f43f5e',
  Eye: '#f43f5e',
  Languages: '#f43f5e',
  Headphones: '#f43f5e',
  Music: '#f43f5e',

  // Categories — section headers
  Blocks: '#3b82f6',
}

/**
 * Custom icon plugin that renders Lucide icons with semantic colors.
 * Drop-in replacement for fumadocs `lucideIconsPlugin`.
 */
export function coloredIconsPlugin(options: { defaultIcon?: keyof typeof icons } = {}) {
  const { defaultIcon } = options

  function resolveIcon(icon?: string) {
    const name = icon ?? defaultIcon
    if (!name) return

    const Icon = icons[name as keyof typeof icons]
    if (!Icon) {
      console.warn(`[colored-icons] Unknown icon: ${name}`)
      return
    }

    const color = iconColorMap[name] ?? 'currentColor'

    return createElement(
      'span',
      {
        key: `icon-${name}`,
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          flexShrink: 0,
          transition: 'transform 0.15s ease, opacity 0.15s ease',
        },
        className: 'fd-icon-wrapper',
      },
      createElement(Icon, {
        key: `lucide-${name}`,
        style: { color, width: 15, height: 15 },
        strokeWidth: 1.75,
      } as any)
    )
  }

  function replaceIcon(node: any) {
    if (node.icon === undefined || typeof node.icon === 'string') node.icon = resolveIcon(node.icon)
    return node
  }

  return {
    name: 'fumadocs:colored-icons',
    transformPageTree: {
      file: replaceIcon,
      folder: replaceIcon,
      separator: replaceIcon,
    },
  }
}
