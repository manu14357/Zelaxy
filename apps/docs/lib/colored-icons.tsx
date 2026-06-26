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

  // ── Extended coverage for the full integration catalogue ──────────────────
  // AI & ML — violet
  BrainCircuit: '#8b5cf6',

  // Flow / dev — blue
  Network: '#3b82f6',

  // Code & API — emerald
  TextCursorInput: '#10b981',

  // Data & analytics — amber
  ChartColumn: '#f59e0b',
  ChartBar: '#f59e0b',
  BarChart: '#f59e0b',
  BarChart2: '#f59e0b',
  BarChart3: '#f59e0b',
  TrendingUp: '#f59e0b',
  Activity: '#f59e0b',
  Radar: '#f59e0b',
  Columns3: '#f59e0b',
  GraduationCap: '#f59e0b',
  FlaskConical: '#f59e0b',

  // Communication — pink
  MessageSquareMore: '#ec4899',
  PhoneCall: '#ec4899',
  Inbox: '#ec4899',
  MailCheck: '#ec4899',

  // Search & research — cyan
  FileSearch: '#06b6d4',
  PackageSearch: '#06b6d4',
  UserSearch: '#06b6d4',
  FileQuestion: '#06b6d4',
  CircleHelp: '#06b6d4',

  // Web & social — orange
  Youtube: '#f97316',
  MonitorPlay: '#f97316',
  Share2: '#f97316',

  // Storage & cloud — slate
  CloudUpload: '#64748b',
  Vault: '#64748b',

  // Security & identity — teal
  ShieldCheck: '#14b8a6',
  KeyRound: '#14b8a6',
  Siren: '#14b8a6',
  Bug: '#14b8a6',
  UserCheck: '#14b8a6',

  // People / CRM — indigo
  Users: '#6366f1',
  ContactRound: '#6366f1',
  Trello: '#6366f1',
  SquareKanban: '#6366f1',
  NotebookPen: '#6366f1',
  Presentation: '#6366f1',
  LayoutTemplate: '#6366f1',

  // Finance & commerce — green
  CreditCard: '#22c55e',
  DollarSign: '#22c55e',
  ShoppingCart: '#22c55e',
  ShoppingBag: '#22c55e',
  Receipt: '#22c55e',

  // Media — rose
  Mic: '#f43f5e',
  AudioLines: '#f43f5e',
  Volume2: '#f43f5e',
  Signature: '#f43f5e',
  Pen: '#f43f5e',
  MapPin: '#f43f5e',
  Map: '#f43f5e',

  // Misc brand-ish
  Grape: '#7c3aed',
  TreePine: '#16a34a',
  Snowflake: '#38bdf8',
  Heart: '#ef4444',
  Flag: '#ef4444',
  TicketCheck: '#6366f1',
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
