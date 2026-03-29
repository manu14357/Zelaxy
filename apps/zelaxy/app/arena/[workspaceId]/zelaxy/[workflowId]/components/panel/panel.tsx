'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Copy,
  MessageSquare,
  RefreshCw,
  Settings,
  Store,
  Trash2,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui'
import { useChatStore } from '@/stores/panel/chat/store'
import { useConsoleStore } from '@/stores/panel/console/store'
import { usePanelStore } from '@/stores/panel/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { Chat } from './components/chat/chat'
import { Properties } from './components/properties/properties'

export function Panel() {
  const [chatMessage, setChatMessage] = useState<string>('')
  const [isControlsExpanded, setIsControlsExpanded] = useState(false)

  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const lastLoadedWorkflowRef = useRef<string | null>(null)

  const isOpen = usePanelStore((state) => state.isOpen)
  const togglePanel = usePanelStore((state) => state.togglePanel)
  const activeTab = usePanelStore((state) => state.activeTab)
  const setActiveTab = usePanelStore((state) => state.setActiveTab)
  const panelWidth = usePanelStore((state) => state.panelWidth)
  const setPanelWidth = usePanelStore((state) => state.setPanelWidth)

  const clearConsole = useConsoleStore((state) => state.clearConsole)
  const exportConsoleCSV = useConsoleStore((state) => state.exportConsoleCSV)
  const clearChat = useChatStore((state) => state.clearChat)
  const exportChatCSV = useChatStore((state) => state.exportChatCSV)
  const { activeWorkflowId, workflows, duplicateWorkflow } = useWorkflowRegistry()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  const handleDeleteWorkflow = () => {
    if (!activeWorkflowId) return

    const workflowList = Object.values(workflows).filter((w) => w.workspaceId === workspaceId)
    const currentIndex = workflowList.findIndex((w) => w.id === activeWorkflowId)

    let nextWorkflowId: string | null = null
    if (workflowList.length > 1) {
      if (currentIndex < workflowList.length - 1) {
        nextWorkflowId = workflowList[currentIndex + 1].id
      } else if (currentIndex > 0) {
        nextWorkflowId = workflowList[currentIndex - 1].id
      }
    }

    if (nextWorkflowId) {
      router.push(`/arena/${workspaceId}/zelaxy/${nextWorkflowId}`)
    } else {
      router.push(`/arena/${workspaceId}`)
    }

    useWorkflowRegistry.getState().removeWorkflow(activeWorkflowId)
  }

  const handleDuplicateWorkflow = async () => {
    if (!activeWorkflowId) return
    try {
      const newWorkflow = await duplicateWorkflow(activeWorkflowId)
      if (newWorkflow) {
        router.push(`/arena/${workspaceId}/zelaxy/${newWorkflow}`)
      }
    } catch (error) {
      console.error('Error duplicating workflow:', error)
    }
  }

  const handleRefreshWorkflow = () => {
    window.location.reload()
  }

  // Handle tab clicks - no loading, just switch tabs
  const handleTabClick = async (tab: 'properties' | 'chat') => {
    setActiveTab(tab)
    if (!isOpen) {
      togglePanel()
    }
  }

  const handleClosePanel = () => {
    togglePanel()
  }

  const handleToggleControls = () => {
    setIsControlsExpanded(!isControlsExpanded)
  }

  // FIXED: Improved resize functionality
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isOpen) return
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setResizeStartX(e.clientX)
      setResizeStartWidth(panelWidth)
    },
    [isOpen, panelWidth]
  )

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return
      e.preventDefault()

      // Calculate new width (expanding left means positive delta increases width)
      const deltaX = resizeStartX - e.clientX
      const newWidth = resizeStartWidth + deltaX

      // Enforce min/max constraints
      const constrainedWidth = Math.max(308, Math.min(800, newWidth))
      setPanelWidth(constrainedWidth)
    },
    [isResizing, resizeStartX, resizeStartWidth, setPanelWidth]
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Add global mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  return (
    <div style={{ '--panel-width': `${panelWidth}px` } as React.CSSProperties}>
      {/* Right Sidebar with vertical icon stack */}
      <div
        className={`fixed top-0 bottom-0 z-30 flex w-[60px] flex-col bg-transparent transition-all duration-300 ease-in-out ${
          isOpen ? 'right-[var(--panel-width)]' : 'right-0'
        }`}
      >
        {/* ...existing sidebar content... */}
        <div className='mt-[2cm] flex flex-col items-center space-y-3 py-4'>
          {/* Expand/Collapse Toggle for Control Icons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggleControls}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isControlsExpanded
                    ? 'border-primary bg-primary/100 text-white shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                }`}
                title={isControlsExpanded ? 'Hide Controls' : 'Show Controls'}
              >
                <ChevronLeft
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isControlsExpanded ? 'rotate-90' : '-rotate-90'
                  }`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side='left'>
              {isControlsExpanded ? 'Hide Controls' : 'Show Controls'}
            </TooltipContent>
          </Tooltip>

          {/* Control Icons - Shown when expanded */}
          {isControlsExpanded && (
            <>
              {/* Deploy Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                    title='Deploy'
                  >
                    <Store className='h-5 w-5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='left'>Deploy</TooltipContent>
              </Tooltip>

              {/* Copy/Duplicate Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleDuplicateWorkflow}
                    className='flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                    title='Duplicate'
                  >
                    <Copy className='h-5 w-5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='left'>Duplicate</TooltipContent>
              </Tooltip>

              {/* Delete Button */}
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <button
                        className='flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-card text-red-500 transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                        title='Delete'
                      >
                        <Trash2 className='h-5 w-5' />
                      </button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side='left'>Delete</TooltipContent>
                </Tooltip>
                <AlertDialogContent className='rounded-xl border-0 shadow-2xl'>
                  <AlertDialogHeader>
                    <AlertDialogTitle className='font-semibold text-lg'>
                      Delete workflow?
                    </AlertDialogTitle>
                    <AlertDialogDescription className='text-gray-600 dark:text-gray-400'>
                      Deleting this workflow will permanently remove all associated blocks,
                      executions, and configuration.{' '}
                      <span className='font-medium text-red-500 dark:text-red-400'>
                        This action cannot be undone.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className='flex gap-3 pt-6'>
                    <AlertDialogCancel className='h-10 flex-1 rounded-full border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteWorkflow}
                      className='h-10 flex-1 rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600'
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Refresh Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleRefreshWorkflow}
                    className='flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                    title='Refresh'
                  >
                    <RefreshCw className='h-5 w-5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='left'>Refresh</TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Panel Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={togglePanel}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isOpen
                    ? 'border-primary bg-primary/100 text-white shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                }`}
                title={isOpen ? 'Collapse Panel' : 'Expand Panel'}
              >
                <svg
                  className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5l7 7-7 7'
                  />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side='left'>
              {isOpen ? 'Collapse Panel' : 'Expand Panel'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom section - Panel tabs */}
        <div className='mt-auto flex flex-col items-center space-y-3 py-4'>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleTabClick('properties')}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isOpen && activeTab === 'properties'
                    ? 'border-primary bg-primary/100 text-white shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                }`}
                title='Properties'
              >
                <Settings className='h-5 w-5' />
              </button>
            </TooltipTrigger>
            <TooltipContent side='left'>Properties</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleTabClick('chat')}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isOpen && activeTab === 'chat'
                    ? 'border-primary bg-primary/100 text-white shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                }`}
                title='Chat'
              >
                <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side='left'>Chat</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Full-height Right Panel that slides in from right */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-20 flex transform flex-col border-border/60 border-l bg-background/95 shadow-xl backdrop-blur-sm transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${panelWidth}px` }}
      >
        {/* FIXED: Improved resize handle with better visibility and larger hit area */}
        <div
          className={`absolute top-0 bottom-0 left-0 z-50 w-1 cursor-col-resize bg-border transition-colors hover:bg-primary/100 ${
            isResizing ? 'bg-primary/100' : ''
          }`}
          onMouseDown={handleResizeStart}
          style={{ touchAction: 'none' }}
        >
          {/* Invisible wider hit area for easier grabbing */}
          <div className='-left-2 absolute top-0 bottom-0 w-5' />
        </div>

        {/* Header - Fixed at top */}
        <div className='flex items-center justify-between border-border/40 border-b bg-muted/20 px-3.5 py-2.5'>
          <div className='flex items-center gap-2'>
            {activeTab === 'chat' ? (
              <div className='flex h-5 w-5 items-center justify-center rounded-md bg-primary/10'>
                <MessageSquare className='h-3 w-3 text-primary dark:text-primary/80' />
              </div>
            ) : (
              <div className='flex h-5 w-5 items-center justify-center rounded-md bg-slate-500/10'>
                <Settings className='h-3 w-3 text-slate-600 dark:text-slate-400' />
              </div>
            )}
            <h3 className='font-semibold text-[13px] text-foreground capitalize tracking-tight'>
              {activeTab}
            </h3>
          </div>
          <div className='flex items-center gap-0.5'>
            {activeTab === 'chat' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => activeWorkflowId && exportChatCSV(activeWorkflowId)}
                    className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                    aria-label='Export chat data'
                  >
                    <ArrowDownToLine className='h-3.5 w-3.5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>Export chat data</TooltipContent>
              </Tooltip>
            )}
            {activeTab === 'chat' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => clearChat(activeWorkflowId)}
                    className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-red-500/10 hover:text-red-600'
                    aria-label='Clear chat'
                  >
                    <CircleSlash className='h-3.5 w-3.5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>Clear chat</TooltipContent>
              </Tooltip>
            )}
            <div className='mx-0.5 h-3.5 w-px bg-border/40' />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleClosePanel}
                  className='rounded-md p-1.5 text-muted-foreground/70 transition-all duration-150 hover:bg-accent/60 hover:text-foreground'
                  aria-label='Close panel'
                >
                  <ChevronRight className='h-3.5 w-3.5' />
                </button>
              </TooltipTrigger>
              <TooltipContent side='bottom'>Close panel</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Panel Content Area - Full height with scroll */}
        <div className='min-h-0 flex-1 overflow-hidden'>
          {/* Keep all tabs mounted but hidden to preserve state and animations */}
          <div className={`h-full ${activeTab === 'properties' ? 'block' : 'hidden'}`}>
            <Properties />
          </div>
          <div
            className={`h-full ${activeTab === 'chat' ? 'flex' : 'hidden'} min-w-0 flex-col overflow-hidden px-3`}
          >
            <Chat
              panelWidth={panelWidth}
              chatMessage={chatMessage}
              setChatMessage={setChatMessage}
            />
          </div>
        </div>
      </div>

      {/* Overlay when panel is open on mobile */}
      {isOpen && (
        <div className='fixed inset-0 z-10 bg-black/20 sm:hidden' onClick={handleClosePanel} />
      )}
    </div>
  )
}
