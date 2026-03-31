'use client'

import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Sparkles,
  Terminal,
  User,
  Variable,
  X,
} from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { client, signOut, useSession } from '@/lib/auth-client'
import { getDefaultAvatarUrl, isMultiavatarUrl } from '@/lib/multiavatar'
import { cn } from '@/lib/utils'
import { useFolderStore } from '@/stores/folders/store'
import { useAvatarStore } from '@/stores/user/avatar-store'

// Utility function to get icon text color based on background color
const getIconTextClass = (bgColor?: string) => {
  if (!bgColor) return 'text-white'

  // Light colors that need dark text
  const lightColors = [
    '#E0E0E0',
    '#FFFFFF',
    '#F8F9FA',
    '#E9ECEF',
    '#DEE2E6',
    '#D6D3C7',
    '#FFEAA7',
    '#FEE12B',
    '#FFC83C',
    '#C0C0C0',
    '#e0e0e0',
    '#ffffff',
    '#ffeaa7',
    '#fee12b',
    '#ffc83c',
    '#FFFF00',
    '#ffff00',
    '#00FFFF',
    '#00ffff',
  ]

  return lightColors.includes(bgColor) ? 'text-gray-900' : 'text-white'
}

// Utility function to get icon background class based on color
const getIconBgClass = (bgColor?: string) => {
  // Handle undefined/null/empty colors
  if (!bgColor || bgColor.trim() === '') {
    return 'bg-gray-500' // Default fallback color
  }

  // Comprehensive color map to handle all block/tool color variations
  const colorMap: Record<string, string> = {
    // Standard colors
    '#6B7280': 'bg-gray-500',
    '#EF4444': 'bg-red-500',
    '#F97316': 'bg-orange-500',
    '#EA580C': 'bg-orange-600',
    '#C2410C': 'bg-orange-700',
    '#FB923C': 'bg-orange-400',
    '#D97706': 'bg-amber-600',
    '#EAB308': 'bg-yellow-500',
    '#22C55E': 'bg-green-500',
    '#06B6D4': 'bg-cyan-500',
    '#8B5CF6': 'bg-violet-500',
    '#EC4899': 'bg-pink-500',
    '#F59E0B': 'bg-amber-500',
    '#10B981': 'bg-emerald-500',
    '#14B8A6': 'bg-teal-500',
    '#8B5A2B': 'bg-amber-700',
    '#DC2626': 'bg-red-600',
    '#059669': 'bg-emerald-600',
    '#FEE12B': 'bg-yellow-400',
    '#FF4B4B': 'bg-red-500', // Translate
    '#FF6B35': 'bg-orange-500',
    '#4ECDC4': 'bg-teal-400',
    '#45B7D1': 'bg-teal-400',
    '#96CEB4': 'bg-emerald-300',
    '#FFEAA7': 'bg-yellow-200',
    '#DDA0DD': 'bg-purple-300',
    '#98D8C8': 'bg-teal-200',
    '#F7DC6F': 'bg-yellow-300',
    '#BB8FCE': 'bg-purple-400',
    '#85C1E9': 'bg-teal-300',

    // Actual block colors from the registry
    '#10a37f': 'bg-emerald-600', // OpenAI
    '#E0E0E0': 'bg-gray-300', // Clay, S3, Jira, etc.
    '#000000': 'bg-black', // Mistral Parse, X
    '#0B0F19': 'bg-gray-900', // HuggingFace
    '#FFC83C': 'bg-yellow-400', // Stagehand Agent
    '#FF0000': 'bg-red-500', // YouTube
    '#1C1C1C': 'bg-gray-800', // Supabase
    '#25D366': 'bg-green-500', // WhatsApp
    '#1A223F': 'bg-slate-800', // Qdrant
    '#262627': 'bg-gray-800', // Typeform
    '#F64F9E': 'bg-pink-500', // Memory
    '#0D1117': 'bg-gray-900', // Pinecone
    '#2B3543': 'bg-slate-700', // Serper
    '#5E6AD2': 'bg-violet-500', // Linear
    '#D6D3C7': 'bg-stone-300', // Linkup
    '#333333': 'bg-gray-700', // Jina
    '#20808D': 'bg-teal-600', // Perplexity
    '#181C1E': 'bg-gray-900', // ElevenLabs, Thinking, Mem0, Firecrawl, Notion
    '#40916C': 'bg-green-600', // File
    '#FF752F': 'bg-orange-500', // Condition
    '#7B68EE': 'bg-violet-500', // Schedule

    // Legacy blue values (backward compat with existing workflows)
    '#2FB3FF': 'bg-orange-500',
    '#6366F1': 'bg-orange-500',
    '#6366f1': 'bg-orange-500',
    '#3B82F6': 'bg-orange-500',
    '#4D5FFF': 'bg-orange-700',
    '#2F55FF': 'bg-orange-600',
    '#1F40ED': 'bg-amber-600',
    '#0066FF': 'bg-amber-500',
    '#4A90D9': 'bg-orange-400',

    // Basic color variations
    '#FFFFFF': 'bg-white',
    '#00FF00': 'bg-green-500',
    '#0000FF': 'bg-orange-500',
    '#FFFF00': 'bg-yellow-500',
    '#FF00FF': 'bg-pink-500',
    '#00FFFF': 'bg-cyan-500',
    '#808080': 'bg-gray-500',
    '#C0C0C0': 'bg-gray-300',
    '#800000': 'bg-red-800',
    '#008000': 'bg-green-800',
    '#000080': 'bg-orange-800',
    '#808000': 'bg-yellow-800',
    '#800080': 'bg-purple-800',
    '#008080': 'bg-teal-800',

    // Lowercase variations for case-insensitive matching
    '#ffffff': 'bg-white',
    '#e0e0e0': 'bg-gray-300',
    '#ff4b4b': 'bg-red-500',
    '#ff0000': 'bg-red-500',
    '#00ff00': 'bg-green-500',
    '#0000ff': 'bg-orange-500',
    '#ffff00': 'bg-yellow-500',
    '#ff00ff': 'bg-pink-500',
    '#00ffff': 'bg-cyan-500',
  }

  // Try both original case and uppercase/lowercase
  return (
    colorMap[bgColor] ||
    colorMap[bgColor?.toUpperCase()] ||
    colorMap[bgColor?.toLowerCase()] ||
    'bg-gray-500'
  )
}

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getBlockDocsUrl, getDocsUrl } from '@/lib/docs-url'
import { createLogger } from '@/lib/logs/console/logger'
import { SearchModal } from '@/app/arena/[workspaceId]/zelaxy/components/search-modal/search-modal'
import { CreateMenu } from '@/app/arena/[workspaceId]/zelaxy/components/sidebar/components/create-menu/create-menu'
import { FolderTree } from '@/app/arena/[workspaceId]/zelaxy/components/sidebar/components/folder-tree/folder-tree'
import { SettingsModal } from '@/app/arena/[workspaceId]/zelaxy/components/sidebar/components/settings-modal/settings-modal'
import { getAllBlocks } from '@/blocks'
import type { BlockConfig } from '@/blocks/types'
import { useCopilotStore } from '@/stores/copilot/store'
import { useConsoleStore } from '@/stores/panel/console/store'
import { usePanelStore } from '@/stores/panel/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import type { WorkflowMetadata } from '@/stores/workflows/registry/types'
import { Console } from '../panel/components/console/console'
import { LLMProviderButton } from '../panel/components/copilot/components/llm-provider-button/llm-provider-button'
import { Copilot } from '../panel/components/copilot/copilot'
import { Variables } from '../panel/components/variables/variables'

const logger = createLogger('AdvancedSidebar')

// Chat History Dropdown Component
function CopilotChatHistoryDropdown() {
  const { chats, currentChat, isLoadingChats, selectChat } = useCopilotStore()

  // Format date for display
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get chat title (first user message or default)
  const getChatTitle = (chat: any) => {
    if (chat.messages && chat.messages.length > 0) {
      const firstUserMessage = chat.messages.find((m: any) => m.role === 'user')
      if (firstUserMessage) {
        return (
          firstUserMessage.content.slice(0, 30) +
          (firstUserMessage.content.length > 30 ? '...' : '')
        )
      }
    }
    return 'New Chat'
  }

  if (isLoadingChats) {
    return (
      <PopoverContent
        className='w-72 rounded-xl border-border/60 p-4 shadow-lg'
        side='left'
        align='start'
      >
        <div className='text-center text-[13px] text-muted-foreground'>Loading chats...</div>
      </PopoverContent>
    )
  }

  if (chats.length === 0) {
    return (
      <PopoverContent
        className='w-72 rounded-xl border-border/60 p-4 shadow-lg'
        side='left'
        align='start'
      >
        <div className='text-center text-[13px] text-muted-foreground'>No chat history yet</div>
      </PopoverContent>
    )
  }

  return (
    <PopoverContent
      className='w-72 rounded-xl border-border/60 p-0 shadow-lg'
      side='left'
      align='start'
    >
      <div className='border-border/40 border-b px-3 py-2.5'>
        <h4 className='font-semibold text-[13px] tracking-tight'>Chat History</h4>
      </div>
      <ScrollArea className='max-h-[300px]'>
        <div className='space-y-0.5 p-1.5'>
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={cn(
                'w-full rounded-lg px-2.5 py-2 text-left text-[13px] transition-all duration-150',
                currentChat?.id === chat.id ? 'bg-primary/10 text-foreground' : 'hover:bg-accent/50'
              )}
            >
              <div className='truncate font-medium'>{getChatTitle(chat)}</div>
              <div className='mt-0.5 text-[11px] text-muted-foreground' suppressHydrationWarning>
                {formatDate(chat.updatedAt || chat.createdAt)}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </PopoverContent>
  )
}

// ─── ProfileDropdown ──────────────────────────────────────────────────────────
// Extracted into its own component so Radix's useId() counter starts fresh
// within this subtree — decoupled from the parent fiber tree and immune to
// any SSR/client rendering differences above it that would shift the counter
// and cause hydration mismatches on the DropdownMenuTrigger id attribute.
interface ProfileDropdownProps {
  expanded: boolean
  avatarUrl: string | null
  userName?: string | null
  userEmail?: string | null
}

function ProfileDropdown({ expanded, avatarUrl, userName, userEmail }: ProfileDropdownProps) {
  const [imgError, setImgError] = useState(false)
  const effectiveUrl = avatarUrl && !imgError ? avatarUrl : null

  const avatarImg = (size: string) =>
    effectiveUrl ? (
      <img
        src={effectiveUrl}
        alt={userName || 'User'}
        className='h-full w-full object-cover'
        onError={() => setImgError(true)}
      />
    ) : (
      <div
        className='flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 font-semibold text-[13px] text-white'
        suppressHydrationWarning
      >
        {userName?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    )

  return (
    <div className='border-border/40 border-t p-2.5'>
      {expanded ? (
        <div className='flex items-center gap-3 rounded-lg p-2'>
          <div className='h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-border/30 ring-offset-1 ring-offset-background'>
            {avatarImg('h-8 w-8')}
          </div>
          <div className='min-w-0 flex-1'>
            <div
              className='truncate font-medium text-[13px] text-foreground'
              suppressHydrationWarning
            >
              {userName || 'User'}
            </div>
            <div className='truncate text-[11px] text-muted-foreground' suppressHydrationWarning>
              {userEmail || 'user@example.com'}
            </div>
          </div>
        </div>
      ) : (
        <div className='flex justify-center py-1'>
          <div className='h-8 w-8 overflow-hidden rounded-full ring-2 ring-border/30 ring-offset-1 ring-offset-background'>
            {avatarImg('h-8 w-8')}
          </div>
        </div>
      )}
    </div>
  )
}

interface AdvancedSidebarProps {
  className?: string
}

type SidebarPanel = 'console' | 'variables' | 'nodes' | 'workflows' | 'copilot' | null

interface SidebarIcon {
  id: SidebarPanel
  icon: React.ElementType
  label: string
  description: string
}

const SIDEBAR_ICONS: SidebarIcon[] = [
  {
    id: 'console',
    icon: Terminal,
    label: 'Console',
    description: 'View console output and logs',
  },
  {
    id: 'variables',
    icon: Variable,
    label: 'Variables',
    description: 'Manage workflow variables',
  },
  {
    id: 'nodes',
    icon: Boxes,
    label: 'Nodes',
    description: 'Browse available nodes',
  },
  {
    id: 'workflows',
    icon: Plus,
    label: 'Workflows',
    description: 'Create and manage workflows',
  },
  {
    id: 'copilot',
    icon: Sparkles,
    label: 'Agie',
    description: 'Your AI Copilot in Every Flow',
  },
]

export function AdvancedSidebar({ className }: AdvancedSidebarProps) {
  const [activePanel, setActivePanel] = useState<SidebarPanel>(null)
  const [isCollapsed, setIsCollapsed] = useState(true) // Default to collapsed (icons only)
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [nodesSearchQuery, setNodesSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = params.workspaceId as string
  const workflowId = params.workflowId as string

  const { data: sessionData } = useSession()
  const { folders, fetchFolders } = useFolderStore()

  // Hydration safety: mark as mounted after first client render
  useEffect(() => {
    setMounted(true)
  }, [])

  const storeAvatarUrl = useAvatarStore((state) => state.avatarUrl)
  const setStoreAvatarUrl = useAvatarStore((state) => state.setAvatarUrl)

  // Compute user avatar URL — store override > session image > Multiavatar fallback
  // Gate all resolution behind `mounted` to avoid hydration mismatch
  // (server always returns null → fallback div; client switches to img after hydration)
  const userAvatarUrl = useMemo(() => {
    if (!mounted) return null
    if (storeAvatarUrl) return storeAvatarUrl
    if (sessionData?.user?.image) return sessionData.user.image
    return getDefaultAvatarUrl(sessionData?.user?.name || sessionData?.user?.email)
  }, [
    storeAvatarUrl,
    sessionData?.user?.image,
    sessionData?.user?.name,
    sessionData?.user?.email,
    mounted,
  ])

  // Auto-assign a Multiavatar for users who don't have one yet
  // (includes users with broken OAuth provider images)
  useEffect(() => {
    if (!mounted || !sessionData?.user?.id) return
    // Skip if user already has a Multiavatar
    if (sessionData?.user?.image && isMultiavatarUrl(sessionData.user.image)) return

    const autoAssignAvatar = async () => {
      const avatarUrl = getDefaultAvatarUrl(sessionData.user.name || sessionData.user.email)
      // Immediately update the store so the avatar shows without waiting for session refresh
      setStoreAvatarUrl(avatarUrl)
      try {
        const { error } = await client.updateUser({ image: avatarUrl })
        if (!error) {
          console.log('[AdvancedSidebar] Auto-assigned Multiavatar for user')
        }
      } catch {
        // Silently fail — the store avatar will still show
      }
    }

    autoAssignAvatar()
  }, [mounted, sessionData?.user?.id, sessionData?.user?.image, setStoreAvatarUrl])

  const clearConsole = useConsoleStore((state) => state.clearConsole)
  const exportConsoleCSV = useConsoleStore((state) => state.exportConsoleCSV)
  const {
    activeWorkflowId,
    workflows,
    createWorkflow,
    isLoading: workflowsLoading,
    loadWorkflows,
  } = useWorkflowRegistry()

  // Get current workflow name
  const currentWorkflow = workflows[workflowId]
  const workflowName = currentWorkflow?.name || 'Untitled Workflow'

  // Get right panel state for responsive layout
  const isRightPanelOpen = usePanelStore((state) => state.isOpen)
  const rightPanelWidth = usePanelStore((state) => state.panelWidth)

  const handleIconClick = useCallback(
    (panelId: SidebarPanel) => {
      if (activePanel === panelId) {
        // Toggle off if clicking the same panel
        setActivePanel(null)
      } else {
        setActivePanel(panelId)
      }
    },
    [activePanel]
  )

  const handleClosePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  const toggleSidebarCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
    // Close any active panel when collapsing to icons-only mode
    if (!isCollapsed) {
      setActivePanel(null)
    }
  }, [isCollapsed])

  // Calculate responsive panel width
  const calculatePanelWidth = useCallback(() => {
    if (!mounted) return 320 // Default for SSR
    const availableWidth = window.innerWidth - (isRightPanelOpen ? rightPanelWidth : 0) - 60 - 100 // sidebar icon width + margin
    return Math.min(320, Math.max(280, availableWidth))
  }, [mounted, isRightPanelOpen, rightPanelWidth])

  // Use responsive width classes — always returns consistent 'w-80' during SSR
  const panelWidthClass = useMemo(() => {
    if (!mounted) return 'w-80' // Consistent SSR default
    const width = calculatePanelWidth()
    if (width <= 280) return 'w-70' // Custom width
    if (width <= 300) return 'w-75' // Custom width
    return 'w-80' // Default 320px
  }, [mounted, calculatePanelWidth])

  // Get all available blocks from registry
  const allBlocks = useMemo(() => getAllBlocks(), [])

  // Group blocks by category
  const blocksByCategory = useMemo(() => {
    const categories: Record<string, BlockConfig[]> = {}

    allBlocks.forEach((block) => {
      const category = block.category || 'Other'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(block)
    })

    // Sort blocks within each category by name
    Object.keys(categories).forEach((category) => {
      categories[category].sort((a, b) => a.name.localeCompare(b.name))
    })

    return categories
  }, [allBlocks])

  // Filter blocks based on search query
  const filteredBlocksByCategory = useMemo(() => {
    if (!nodesSearchQuery.trim()) return blocksByCategory

    const filtered: Record<string, BlockConfig[]> = {}
    const query = nodesSearchQuery.toLowerCase()

    Object.entries(blocksByCategory).forEach(([category, blocks]) => {
      const matchingBlocks = blocks.filter(
        (block) =>
          block.name?.toLowerCase().includes(query) ||
          block.description?.toLowerCase().includes(query)
      )
      if (matchingBlocks.length > 0) {
        filtered[category] = matchingBlocks
      }
    })

    return filtered
  }, [blocksByCategory, nodesSearchQuery])
  // Handle block/tool click to add to workflow
  const handleBlockClick = useCallback((blockType: string) => {
    logger.info('Adding block via click:', blockType)
    // Dispatch a custom event to be caught by the workflow component
    const event = new CustomEvent('add-block-from-toolbar', {
      detail: {
        type: blockType,
      },
    })
    window.dispatchEvent(event)
  }, [])

  const handleCreateWorkflow = useCallback(
    async (folderId?: string): Promise<string> => {
      if (isCreatingWorkflow) {
        logger.info('Workflow creation already in progress, ignoring request')
        throw new Error('Workflow creation already in progress')
      }

      try {
        setIsCreatingWorkflow(true)

        // Validate folderId if provided - don't pass invalid/placeholder folder IDs
        let validFolderId: string | undefined
        if (folderId && folderId !== 'new-folder' && folderId !== 'temp-folder') {
          // Check if folder exists in the current workspace
          const folderExists = Object.values(folders).some(
            (folder: any) => folder.id === folderId && folder.workspaceId === workspaceId
          )
          if (folderExists) {
            validFolderId = folderId
          } else {
            logger.warn(`Invalid folder ID provided: ${folderId}, creating workflow without folder`)
          }
        }

        const id = await createWorkflow({
          workspaceId: workspaceId || undefined,
          folderId: validFolderId,
        })

        // Navigate to the new workflow
        router.push(`/arena/${workspaceId}/zelaxy/${id}`)
        return id
      } catch (error) {
        logger.error('Error creating workflow:', error)
        throw error
      } finally {
        setIsCreatingWorkflow(false)
      }
    },
    [createWorkflow, workspaceId, router, isCreatingWorkflow, folders]
  )

  // Get workflows for current workspace
  const workspaceWorkflows = useMemo(() => {
    if (workflowsLoading) return []

    const filteredWorkflows = Object.values(workflows).filter(
      (workflow) => workflow.workspaceId === workspaceId || !workflow.workspaceId
    )

    // TODO: Add "My Workflows" filter when user ownership data is available in workflow metadata
    // For now, we'll show all workflows since we don't have user ownership fields

    return filteredWorkflows.sort((a, b) => {
      const dateA =
        a.lastModified instanceof Date
          ? a.lastModified.getTime()
          : new Date(a.lastModified).getTime()
      const dateB =
        b.lastModified instanceof Date
          ? b.lastModified.getTime()
          : new Date(b.lastModified).getTime()
      return dateB - dateA
    })
  }, [workflows, workspaceId, workflowsLoading])

  // Separate regular workflows from temporary marketplace workflows (using filtered workflows)
  const { regularWorkflows, tempWorkflows } = useMemo(() => {
    const regular: WorkflowMetadata[] = []
    const temp: WorkflowMetadata[] = []

    if (!workflowsLoading) {
      workspaceWorkflows.forEach((workflow) => {
        if (workflow.marketplaceData?.status === 'temp') {
          temp.push(workflow)
        } else {
          regular.push(workflow)
        }
      })

      // Sort by last modified date (newest first)
      const sortByLastModified = (a: WorkflowMetadata, b: WorkflowMetadata) => {
        const dateA =
          a.lastModified instanceof Date
            ? a.lastModified.getTime()
            : new Date(a.lastModified).getTime()
        const dateB =
          b.lastModified instanceof Date
            ? b.lastModified.getTime()
            : new Date(b.lastModified).getTime()
        return dateB - dateA
      }

      regular.sort(sortByLastModified)
      temp.sort(sortByLastModified)
    }

    return { regularWorkflows: regular, tempWorkflows: temp }
  }, [workspaceWorkflows, workflowsLoading])

  // Load workflows for the current workspace when workspaceId changes
  useEffect(() => {
    if (workspaceId) {
      loadWorkflows(workspaceId)
      fetchFolders(workspaceId) // Also load folders for validation
    }
  }, [workspaceId, loadWorkflows, fetchFolders])

  // Add event listener for opening console panel from external components
  useEffect(() => {
    const handleOpenConsole = () => {
      setActivePanel('console')
      setIsCollapsed(false) // Ensure sidebar is expanded
    }

    window.addEventListener('open-console-panel', handleOpenConsole)
    return () => window.removeEventListener('open-console-panel', handleOpenConsole)
  }, [])

  // Cmd+K keyboard shortcut to open search modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isEditableElement =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.hasAttribute('contenteditable')

      if (isEditableElement) return

      if (
        event.key?.toLowerCase() === 'k' &&
        ((event.metaKey && typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent)) ||
          (event.ctrlKey &&
            (typeof navigator === 'undefined' || !/mac/i.test(navigator.userAgent))))
      ) {
        event.preventDefault()
        setShowSearchModal(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Prepare workflows for search modal
  const searchWorkflows = useMemo(() => {
    if (workflowsLoading) return []
    const allWfs = [...regularWorkflows, ...tempWorkflows]
    return allWfs.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      href: `/arena/${workspaceId}/zelaxy/${workflow.id}`,
      isCurrent: workflow.id === workflowId,
    }))
  }, [regularWorkflows, tempWorkflows, workspaceId, workflowId, workflowsLoading])

  const renderPanelContent = () => {
    if (!activePanel) return null

    switch (activePanel) {
      case 'console':
        return (
          <div className='flex h-full flex-col'>
            {/* Console Header */}
            <div className='flex items-center justify-between border-border/40 border-b bg-muted/20 px-3.5 py-2.5'>
              <div className='flex items-center gap-2'>
                <div className='flex h-5 w-5 items-center justify-center rounded-md bg-green-500/10'>
                  <Terminal className='h-3 w-3 text-green-600 dark:text-green-400' />
                </div>
                <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
                  Console
                </h3>
              </div>
              <div className='flex items-center gap-0.5'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => activeWorkflowId && exportConsoleCSV(activeWorkflowId)}
                      className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                      title='Export console data'
                    >
                      <Download className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Export console data</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => clearConsole(activeWorkflowId)}
                      className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-red-500/10 hover:text-red-600'
                      title='Clear console'
                    >
                      <X className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Clear console</TooltipContent>
                </Tooltip>
                <div className='mx-0.5 h-3.5 w-px bg-border/40' />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleClosePanel}
                      className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                      title='Close panel'
                    >
                      <ChevronLeft className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Close panel</TooltipContent>
                </Tooltip>
              </div>
            </div>
            {/* Console Content */}
            <div className='flex-1 overflow-hidden'>
              <Console panelWidth={320} />
            </div>
          </div>
        )

      case 'variables':
        return (
          <div className='flex h-full flex-col'>
            {/* Variables Header */}
            <div className='flex items-center justify-between border-border/40 border-b bg-muted/20 px-3.5 py-2.5'>
              <div className='flex items-center gap-2'>
                <div className='flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/10'>
                  <Variable className='h-3 w-3 text-purple-600 dark:text-purple-400' />
                </div>
                <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
                  Variables
                </h3>
              </div>
              <div className='flex items-center gap-0.5'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {}}
                      className='flex items-center gap-1 rounded-md border border-border/50 bg-background px-2 py-1 font-medium text-[11px] text-muted-foreground transition-all duration-150 hover:border-purple-300 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:border-purple-600 dark:hover:text-purple-400'
                      title='Add variable'
                    >
                      <Plus className='h-3 w-3' />
                      <span>Add</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Add a new variable</TooltipContent>
                </Tooltip>
                <div className='mx-0.5 h-3.5 w-px bg-border/40' />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleClosePanel}
                      className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                      title='Close panel'
                    >
                      <ChevronLeft className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Close panel</TooltipContent>
                </Tooltip>
              </div>
            </div>
            {/* Variables Content */}
            <div className='flex-1 overflow-hidden'>
              <Variables />
            </div>
          </div>
        )

      case 'nodes':
        return (
          <div className='flex h-full max-h-full flex-col'>
            {/* Nodes Header */}
            <div className='flex flex-shrink-0 items-center justify-between border-border/40 border-b bg-muted/20 px-3.5 py-2.5'>
              <div className='flex items-center gap-2'>
                <div className='flex h-5 w-5 items-center justify-center rounded-md bg-primary/10'>
                  <Boxes className='h-3 w-3 text-primary dark:text-primary/80' />
                </div>
                <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
                  Node Library
                </h3>
              </div>
              <span className='rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-[10px] text-primary tabular-nums dark:text-primary/80'>
                {Object.values(filteredBlocksByCategory).reduce(
                  (total, blocks) => total + blocks.length,
                  0
                )}
              </span>
              <div className='flex-1' />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleClosePanel}
                    className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                    title='Close panel'
                  >
                    <ChevronLeft className='h-3.5 w-3.5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>Close panel</TooltipContent>
              </Tooltip>
            </div>
            {/* Search */}
            <div className='flex-shrink-0 border-border/40 border-b bg-muted/10 px-3 py-2'>
              <div className='relative'>
                <Search className='-translate-y-1/2 absolute top-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground/50' />
                <Input
                  type='text'
                  placeholder='Search nodes...'
                  value={nodesSearchQuery}
                  onChange={(e) => setNodesSearchQuery(e.target.value)}
                  className='h-8 w-full rounded-lg border-border/50 bg-background pl-8 text-[13px] placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/30'
                />
              </div>
            </div>
            {/* Node List */}
            <div className='min-h-0 flex-1 overflow-hidden'>
              <ScrollArea className='h-full'>
                <div className='space-y-4 p-2.5'>
                  {Object.entries(filteredBlocksByCategory).map(([category, blocks]) => (
                    <div key={category}>
                      <div className='mb-1.5 flex items-center gap-2 px-1'>
                        <h4 className='font-semibold text-[11px] text-muted-foreground/60 uppercase tracking-wider'>
                          {category}
                        </h4>
                        <span className='text-[10px] text-muted-foreground/40 tabular-nums'>
                          {blocks.length}
                        </span>
                        <div className='h-px flex-1 bg-border/30' />
                      </div>
                      <div className='grid grid-cols-1 gap-0.5'>
                        {blocks.map((block) => (
                          <div
                            key={block.type}
                            className='group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 transition-all duration-150 hover:border-border/50 hover:bg-accent/40 hover:shadow-sm active:cursor-grabbing'
                            draggable={true}
                            onDragStart={(e) => {
                              logger.info('Starting drag for block:', block.type, block.name)

                              // Set multiple data formats for compatibility
                              e.dataTransfer.setData('text/plain', block.type)
                              e.dataTransfer.setData('application/reactflow', block.type)
                              e.dataTransfer.setData(
                                'application/json',
                                JSON.stringify({
                                  type: block.type,
                                  name: block.name,
                                  description: block.description,
                                })
                              )
                              e.dataTransfer.effectAllowed = 'copy'

                              // Add visual feedback
                              e.currentTarget.style.opacity = '0.5'
                              e.currentTarget.style.transform = 'scale(0.95)'
                            }}
                            onDragEnd={(e) => {
                              logger.info('Drag ended for block:', block.type)
                              // Reset visual feedback
                              e.currentTarget.style.opacity = '1'
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                            onClick={() => handleBlockClick(block.type)}
                            title={`${block.description || block.name} - Click to add or drag to canvas`}
                          >
                            {/* Icon */}
                            <div className='flex-shrink-0'>
                              <div
                                className={cn(
                                  'flex h-6 w-6 items-center justify-center rounded-md border border-white/20 font-medium text-xs shadow-sm',
                                  getIconBgClass(block.bgColor),
                                  getIconTextClass(block.bgColor)
                                )}
                                data-bg-color={block.bgColor || '#6B7280'}
                              >
                                {block.icon ? (
                                  <block.icon className='h-3.5 w-3.5' />
                                ) : (
                                  block.name.charAt(0).toUpperCase()
                                )}
                              </div>
                            </div>

                            {/* Name and Description */}
                            <div className='min-w-0 flex-1'>
                              <div className='truncate font-medium text-[13px] text-foreground'>
                                {block.name}
                              </div>
                              {block.description && (
                                <div className='truncate text-[11px] text-muted-foreground/70 leading-tight'>
                                  {block.description}
                                </div>
                              )}
                            </div>

                            {/* Docs link + Drag indicator */}
                            <div className='flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                              {getBlockDocsUrl(block.type, block.category) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={getBlockDocsUrl(block.type, block.category)!}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      title={`View ${block.name} documentation`}
                                      className='flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-primary/10 hover:text-primary'
                                      onClick={(e) => e.stopPropagation()}
                                      onDragStart={(e) => e.preventDefault()}
                                    >
                                      <BookOpen className='h-3 w-3' />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent side='right'>View docs</TooltipContent>
                                </Tooltip>
                              )}
                              <div className='flex flex-col gap-0.5'>
                                <div className='h-1 w-1 rounded-full bg-muted-foreground/50' />
                                <div className='h-1 w-1 rounded-full bg-muted-foreground/50' />
                                <div className='h-1 w-1 rounded-full bg-muted-foreground/50' />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {Object.keys(filteredBlocksByCategory).length === 0 && (
                    <div className='flex flex-col items-center justify-center py-12'>
                      <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50'>
                        <Boxes className='h-5 w-5 text-muted-foreground/40' />
                      </div>
                      <p className='font-medium text-[13px] text-muted-foreground'>
                        {nodesSearchQuery ? 'No nodes found' : 'No nodes available'}
                      </p>
                      {nodesSearchQuery && (
                        <p className='mt-1 text-[11px] text-muted-foreground/60'>
                          Try a different search term
                        </p>
                      )}
                      {nodesSearchQuery && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setNodesSearchQuery('')}
                          className='mt-3 h-7 rounded-lg border-border/50 px-3 text-[11px]'
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )

      case 'workflows':
        return (
          <div className='flex h-full max-h-full flex-col'>
            {/* Workflows Header */}
            <div className='flex flex-shrink-0 items-center justify-between border-border/40 border-b bg-muted/20 px-3.5 py-2.5'>
              <div className='flex items-center gap-2'>
                <div className='flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/10'>
                  <Plus className='h-3 w-3 text-orange-600 dark:text-orange-400' />
                </div>
                <h3 className='font-semibold text-[13px] text-foreground tracking-tight'>
                  Workflows
                </h3>
                <span className='rounded-full bg-orange-500/10 px-2 py-0.5 font-semibold text-[10px] text-orange-600 tabular-nums dark:text-orange-400'>
                  {regularWorkflows.length}
                </span>
              </div>
              <div className='flex items-center gap-0.5'>
                <CreateMenu
                  onCreateWorkflow={handleCreateWorkflow}
                  isCreatingWorkflow={isCreatingWorkflow}
                />
                <div className='mx-0.5 h-3.5 w-px bg-border/40' />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleClosePanel}
                      className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                      title='Close panel'
                    >
                      <ChevronLeft className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Close panel</TooltipContent>
                </Tooltip>
              </div>
            </div>
            {/* Workflow List */}
            <div className='min-h-0 flex-1 overflow-hidden'>
              <ScrollArea className='h-full'>
                <div className='px-2 py-1'>
                  <FolderTree
                    regularWorkflows={regularWorkflows}
                    marketplaceWorkflows={tempWorkflows}
                    isLoading={workflowsLoading}
                    onCreateWorkflow={handleCreateWorkflow}
                  />
                </div>
              </ScrollArea>
            </div>
          </div>
        )

      case 'copilot':
        return (
          <div className='flex h-full flex-col'>
            {/* Copilot Header */}
            <div className='flex items-center justify-between border-border/40 border-b bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-orange-500/5 px-3.5 py-2.5'>
              <div className='flex items-center gap-2'>
                <div className='flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-amber-500/20 to-amber-500/20'>
                  <Sparkles className='h-3 w-3 text-amber-600 dark:text-amber-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-[12px] text-foreground tracking-tight'>Agie</h3>
                </div>
              </div>
              <div className='flex items-center gap-0.5'>
                {/* LLM Provider Button */}
                <LLMProviderButton />
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                      title='Chat history'
                    >
                      <History className='h-3.5 w-3.5' />
                    </button>
                  </PopoverTrigger>
                  <CopilotChatHistoryDropdown />
                </Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        // Trigger new chat creation
                        const event = new CustomEvent('copilot-new-chat')
                        window.dispatchEvent(event)
                      }}
                      className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                      title='New chat'
                    >
                      <Plus className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>New chat</TooltipContent>
                </Tooltip>
                <div className='mx-0.5 h-3.5 w-px bg-border/40' />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleClosePanel}
                      className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                      title='Close panel'
                    >
                      <ChevronLeft className='h-3.5 w-3.5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>Close panel</TooltipContent>
                </Tooltip>
              </div>
            </div>
            {/* Copilot Content */}
            <div className='flex-1 overflow-hidden px-1'>
              <Copilot panelWidth={calculatePanelWidth()} />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <div
        className={cn('fixed relative top-0 bottom-0 left-0 z-50 flex h-screen', className)}
        data-sidebar-width={
          activePanel ? `${60 + calculatePanelWidth()}px` : isCollapsed ? '60px' : '220px'
        }
      >
        {/* Always-open Sidebar with Icons + Names */}
        <div
          className={cn(
            'group relative flex h-screen flex-col border-border/60 border-r bg-card/80 backdrop-blur-md transition-all duration-300 ease-out',
            activePanel || isCollapsed ? 'w-[60px]' : 'w-[220px]'
          )}
        >
          {/* Toggle Button - Only visible when no panel is open */}
          {!activePanel && (
            <button
              onClick={toggleSidebarCollapse}
              className='-right-3 -translate-y-1/2 absolute top-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background shadow-md transition-all duration-200 hover:scale-110 hover:border-primary/40 hover:shadow-lg'
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className='h-3 w-3 text-primary' />
              ) : (
                <ChevronLeft className='h-3 w-3 text-primary' />
              )}
            </button>
          )}
          {/* Company Logo and Brand */}
          {!activePanel && !isCollapsed ? (
            // Expanded: Show logo + name
            <div className='flex h-12 items-center border-border/40 border-b px-3'>
              <div className='flex items-center gap-2.5'>
                <div className='flex h-6 w-6 items-center justify-center'>
                  <img src='/Zelaxy.png' alt='Zelaxy' width={20} height={20} className='h-5 w-5' />
                </div>
                <span className='font-semibold text-[13px] text-foreground tracking-tight'>
                  Zelaxy
                </span>
              </div>
            </div>
          ) : (
            // Collapsed: Show only logo
            <div className='flex h-12 items-center justify-center border-border/40 border-b'>
              <div className='flex h-8 w-8 items-center justify-center'>
                <img src='/Zelaxy.png' alt='Zelaxy' width={24} height={24} className='h-6 w-6' />
              </div>
            </div>
          )}

          {/* Workflow Name (only shown when expanded, no panel is open, and on workflow page) */}
          {!activePanel &&
            !isCollapsed &&
            pathname.match(/^\/workspace\/[^/]+\/zelaxy\/[^/]+$/) && (
              <div className='flex items-center justify-between border-border/40 border-b px-4 py-2.5'>
                <h2
                  className='flex-1 truncate font-medium text-[13px] text-foreground/90'
                  title={workflowName}
                >
                  {workflowName}
                </h2>
              </div>
            )}

          {/* Icon List */}
          <div className='flex-1 space-y-1 px-2 py-3'>
            {SIDEBAR_ICONS.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleIconClick(item.id)}
                    className={cn(
                      'relative flex w-full items-center rounded-lg transition-all duration-150',
                      activePanel === item.id
                        ? 'bg-primary/10 text-primary shadow-sm dark:bg-primary/100/15 dark:text-primary/80'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      activePanel || isCollapsed
                        ? 'h-10 justify-center'
                        : 'h-10 justify-start gap-3 px-3'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                        activePanel === item.id
                          ? 'text-primary dark:text-primary/80'
                          : 'text-primary/80 group-hover:text-primary'
                      )}
                    />
                    {!activePanel && !isCollapsed && (
                      <span className='truncate font-medium text-[13px]'>{item.label}</span>
                    )}
                    {activePanel === item.id && (
                      <div className='-translate-y-1/2 absolute top-1/2 left-0 h-5 w-[3px] rounded-r-full bg-primary/100' />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side='right'>
                  <div>
                    <div className='font-medium'>{item.label}</div>
                    <div className='text-muted-foreground text-xs'>{item.description}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Bottom Navigation Icons */}
          <div className='space-y-1 border-border/40 border-t px-2 py-3'>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push(`/arena/${workspaceId}/hub`)}
                  className={cn(
                    'relative flex w-full items-center rounded-lg transition-all duration-150',
                    'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    activePanel || isCollapsed
                      ? 'h-10 justify-center'
                      : 'h-10 justify-start gap-3 px-3'
                  )}
                >
                  <LayoutDashboard className='h-[18px] w-[18px] flex-shrink-0 text-primary/80' />
                  {!activePanel && !isCollapsed && (
                    <span className='truncate font-medium text-[13px]'>Hub</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                <div className='font-medium'>Hub</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className={cn(
                    'relative flex w-full items-center rounded-lg transition-all duration-150',
                    'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    activePanel || isCollapsed
                      ? 'h-10 justify-center'
                      : 'h-10 justify-start gap-3 px-3'
                  )}
                >
                  <Settings className='h-[18px] w-[18px] flex-shrink-0 text-primary/80' />
                  {!activePanel && !isCollapsed && (
                    <span className='truncate font-medium text-[13px]'>Settings</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                <div className='font-medium'>Settings</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={getDocsUrl()}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cn(
                    'relative flex w-full items-center rounded-lg transition-all duration-150',
                    'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    activePanel || isCollapsed
                      ? 'h-10 justify-center'
                      : 'h-10 justify-start gap-3 px-3'
                  )}
                >
                  <BookOpen className='h-[18px] w-[18px] flex-shrink-0 text-primary/80' />
                  {!activePanel && !isCollapsed && (
                    <span className='truncate font-medium text-[13px]'>Docs</span>
                  )}
                </a>
              </TooltipTrigger>
              <TooltipContent side='right'>
                <div className='font-medium'>Documentation</div>
                <div className='text-muted-foreground text-xs'>View guides &amp; references</div>
              </TooltipContent>
            </Tooltip>

            {/* <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push(`/arena/${workspaceId}/help`)}
                  className={cn(
                    'relative flex w-full items-center transition-colors',
                    'hover:bg-accent',
                    pathname === `/arena/${workspaceId}/help` &&
                      'bg-accent text-accent-foreground',
                    activePanel || isCollapsed
                      ? 'h-14 justify-center'
                      : 'h-11 justify-start gap-3 px-4'
                  )}
                >
                  <HelpCircle className={cn(
                    'h-5 w-5 flex-shrink-0',
                    pathname === `/arena/${workspaceId}/help`
                      ? 'text-primary'
                      : 'text-primary hover:text-primary'
                  )} />
                  {!activePanel && !isCollapsed && (
                    <span className='truncate font-medium text-foreground text-sm'>Help</span>
                  )}
                </button>
              </TooltipTrigger>
              {(activePanel || isCollapsed) && (
                <TooltipContent side='right'>
                  <div className='font-medium'>Help</div>
                </TooltipContent>
              )}
            </Tooltip> */}
          </div>

          {/* User Profile Section */}
          <ProfileDropdown
            expanded={!activePanel && !isCollapsed}
            avatarUrl={userAvatarUrl}
            userName={sessionData?.user?.name}
            userEmail={sessionData?.user?.email}
          />
        </div>

        {/* Panel Content */}
        {activePanel && (
          <div
            className={cn(
              'relative z-40 flex h-screen flex-col border-border/60 border-r bg-background/95 shadow-xl backdrop-blur-sm transition-all duration-300 ease-out',
              panelWidthClass
            )}
          >
            {/* Panel Content */}
            <div className='relative z-40 min-h-0 flex-1 overflow-hidden'>
              {renderPanelContent()}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />

      {/* Search Modal */}
      <SearchModal
        open={showSearchModal}
        onOpenChange={setShowSearchModal}
        workflows={searchWorkflows}
        isOnWorkflowPage={true}
      />
    </>
  )
}

// Keyboard Shortcut Component
interface KeyboardShortcutProps {
  shortcut: string
  className?: string
}

const KeyboardShortcut = ({ shortcut, className }: KeyboardShortcutProps) => {
  const parts = shortcut.split('+')

  // Helper function to determine if a part is a symbol that should be larger
  const isSymbol = (part: string) => {
    return ['⌘', '⇧', '⌥', '⌃'].includes(part)
  }

  return (
    <kbd
      className={cn(
        'flex h-5 items-center justify-center rounded-md border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground/60',
        className
      )}
    >
      <span className='flex items-center justify-center gap-[1px]'>
        {parts.map((part, index) => (
          <span key={index} className={cn(isSymbol(part) ? 'text-[14px]' : 'text-[10px]')}>
            {part}
          </span>
        ))}
      </span>
    </kbd>
  )
}
