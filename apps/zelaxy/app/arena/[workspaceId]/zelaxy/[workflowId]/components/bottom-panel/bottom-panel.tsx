'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  ChevronDown,
  CircleSlash,
  Maximize2,
  Minimize2,
  Terminal,
  Variable,
  X,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useConsoleStore } from '@/stores/panel/console/store'
import { usePanelStore } from '@/stores/panel/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { Console } from '../panel/components/console/console'
import { Variables } from '../panel/components/variables/variables'
import styles from './bottom-panel.module.css'

interface BottomPanelProps {
  className?: string
}

interface PanelPosition {
  x: number
  y: number
  width: number
  height: number
}

interface ResizeHandle {
  cursor: string
  position:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
}

const RESIZE_HANDLES: ResizeHandle[] = [
  { cursor: 'n-resize', position: 'top' },
  { cursor: 's-resize', position: 'bottom' },
  { cursor: 'w-resize', position: 'left' },
  { cursor: 'e-resize', position: 'right' },
  { cursor: 'nw-resize', position: 'top-left' },
  { cursor: 'ne-resize', position: 'top-right' },
  { cursor: 'sw-resize', position: 'bottom-left' },
  { cursor: 'se-resize', position: 'bottom-right' },
]

export function BottomPanel({ className }: BottomPanelProps) {
  const [isOpen, setIsOpen] = useState(false) // Start closed
  const [isMinimized, setIsMinimized] = useState(false) // Add minimize state
  const [activeTab, setActiveTab] = useState<'console' | 'variables'>('console')
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // Get right panel state for responsive positioning
  const rightPanelIsOpen = usePanelStore((state) => state.isOpen)
  const rightPanelWidth = usePanelStore((state) => state.panelWidth)

  // Get console and workflow store actions
  const clearConsole = useConsoleStore((state) => state.clearConsole)
  const exportConsoleCSV = useConsoleStore((state) => state.exportConsoleCSV)
  const { activeWorkflowId } = useWorkflowRegistry()

  // Default panel position (bottom center)
  const [position, setPosition] = useState<PanelPosition>({
    x: 0, // Will be calculated after mount
    y: 0, // Will be calculated after mount
    width: 800, // Default width (above minimum)
    height: 350, // Increased default height (above minimum)
  })

  // Initialize position after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Calculate position considering right panel
      const screenWidth = window.innerWidth
      const leftSidebarWidth = 240 // Approximate width of left sidebar
      const rightPanelOffset = rightPanelIsOpen ? rightPanelWidth / 2 : 0

      setPosition({
        x: screenWidth / 2 - 400 - rightPanelOffset + leftSidebarWidth / 2, // Center horizontally, considering both panels
        y: window.innerHeight - 400, // Bottom position with more margin for larger panel
        width: 800,
        height: 350,
      })
    }
  }, [rightPanelIsOpen, rightPanelWidth])

  // Handle tab clicks
  const handleTabClick = (tab: 'console' | 'variables') => {
    if (activeTab === tab && isOpen && !isMinimized) {
      // If clicking the same tab and panel is open, minimize it
      setIsMinimized(true)
    } else {
      setActiveTab(tab)
      setIsOpen(true)
      setIsMinimized(false)
    }
  }

  // Handle panel close
  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  // Handle minimize/restore
  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  // Handle maximize/minimize
  const handleMaximize = () => {
    if (typeof window === 'undefined') return

    if (isMaximized) {
      // Restore to previous position with panels consideration
      const screenWidth = window.innerWidth
      const leftSidebarWidth = 240
      const rightPanelOffset = rightPanelIsOpen ? rightPanelWidth / 2 : 0

      setPosition({
        x: screenWidth / 2 - 400 - rightPanelOffset + leftSidebarWidth / 2,
        y: window.innerHeight - 400,
        width: 800,
        height: 350,
      })
    } else {
      // Maximize to full screen
      setPosition({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    setIsMaximized(!isMaximized)
  }

  // Drag functionality
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return
      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    },
    [position, isMaximized]
  )

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || isMaximized || typeof window === 'undefined') return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Keep panel within viewport bounds
      const maxX = window.innerWidth - position.width
      const maxY = window.innerHeight - position.height

      setPosition((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      }))
    },
    [isDragging, dragStart, position.width, position.height, isMaximized]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Resize functionality
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string) => {
      if (isMaximized) return
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setResizeHandle(handle)
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: position.width,
        height: position.height,
      })
    },
    [position, isMaximized]
  )

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeHandle || isMaximized) return

      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      const newPosition = { ...position }

      // Minimum dimensions
      const minWidth = 400 // Increased minimum width
      const minHeight = 250 // Increased minimum height

      switch (resizeHandle) {
        case 'top':
          newPosition.height = Math.max(minHeight, resizeStart.height - deltaY)
          newPosition.y = position.y + (resizeStart.height - newPosition.height)
          break
        case 'bottom':
          newPosition.height = Math.max(minHeight, resizeStart.height + deltaY)
          break
        case 'left':
          newPosition.width = Math.max(minWidth, resizeStart.width - deltaX)
          newPosition.x = position.x + (resizeStart.width - newPosition.width)
          break
        case 'right':
          newPosition.width = Math.max(minWidth, resizeStart.width + deltaX)
          break
        case 'top-left':
          newPosition.width = Math.max(minWidth, resizeStart.width - deltaX)
          newPosition.height = Math.max(minHeight, resizeStart.height - deltaY)
          newPosition.x = position.x + (resizeStart.width - newPosition.width)
          newPosition.y = position.y + (resizeStart.height - newPosition.height)
          break
        case 'top-right':
          newPosition.width = Math.max(minWidth, resizeStart.width + deltaX)
          newPosition.height = Math.max(minHeight, resizeStart.height - deltaY)
          newPosition.y = position.y + (resizeStart.height - newPosition.height)
          break
        case 'bottom-left':
          newPosition.width = Math.max(minWidth, resizeStart.width - deltaX)
          newPosition.height = Math.max(minHeight, resizeStart.height + deltaY)
          newPosition.x = position.x + (resizeStart.width - newPosition.width)
          break
        case 'bottom-right':
          newPosition.width = Math.max(minWidth, resizeStart.width + deltaX)
          newPosition.height = Math.max(minHeight, resizeStart.height + deltaY)
          break
      }

      // Keep within viewport bounds
      if (typeof window !== 'undefined') {
        newPosition.x = Math.max(0, Math.min(newPosition.x, window.innerWidth - newPosition.width))
        newPosition.y = Math.max(
          0,
          Math.min(newPosition.y, window.innerHeight - newPosition.height)
        )
      }

      setPosition(newPosition)
    },
    [isResizing, resizeHandle, resizeStart, position, isMaximized]
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeHandle(null)
  }, [])

  // Global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleDragEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleDrag, handleDragEnd])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleResize, handleResizeEnd])

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (typeof window === 'undefined') return

      if (isMaximized) {
        setPosition({
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        })
      } else {
        // Keep panel within bounds when window resizes
        setPosition((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(prev.x, window.innerWidth - prev.width)),
          y: Math.max(0, Math.min(prev.y, window.innerHeight - prev.height)),
        }))
      }
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [isMaximized])

  return (
    <>
      {/* Tab Bar - Only visible when panel is closed or minimized */}
      {(!isOpen || isMinimized) && (
        <div
          className={cn(
            'fixed bottom-4 z-30 transition-all duration-200',
            'flex items-center gap-1 rounded-lg border bg-card px-2 py-1 shadow-lg',
            isMinimized && 'bg-accent/50', // Different style when minimized
            className
          )}
          style={{
            left: '50%',
            transform: rightPanelIsOpen
              ? `translateX(calc(-50% - ${rightPanelWidth / 2}px + 120px))` // Offset for both panels
              : 'translateX(calc(-50% + 120px))', // Offset for left panel only
          }}
        >
          <button
            onClick={() => handleTabClick('console')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-all duration-200',
              'hover:bg-accent/50',
              activeTab === 'console'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Terminal className='h-4 w-4' />
            Console
          </button>
          <button
            onClick={() => handleTabClick('variables')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-all duration-200',
              'hover:bg-accent/50',
              activeTab === 'variables'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Variable className='h-4 w-4' />
            Variables
          </button>

          {/* Minimized indicator */}
          {isMinimized && (
            <div className='flex items-center gap-1 px-2 py-1 text-muted-foreground'>
              <ChevronDown className='h-3 w-3' />
            </div>
          )}
        </div>
      )}

      {/* Panel Content - Draggable and Resizable */}
      {isOpen && !isMinimized && (
        <div
          className={cn(
            'fixed z-20 overflow-hidden rounded-lg border bg-card shadow-xl',
            styles.bottomPanel
          )}
          // eslint-disable-next-line react/forbid-dom-props
          style={
            {
              '--panel-left': `${position.x}px`,
              '--panel-top': `${position.y}px`,
              '--panel-width': `${position.width}px`,
              '--panel-height': `${position.height}px`,
            } as React.CSSProperties
          }
        >
          {/* Resize Handles */}
          {!isMaximized &&
            RESIZE_HANDLES.map((handle) => (
              <div
                key={handle.position}
                className={cn(
                  'absolute z-30',
                  handle.position === 'top' && 'top-0 right-2 left-2 h-1 cursor-n-resize',
                  handle.position === 'bottom' && 'right-2 bottom-0 left-2 h-1 cursor-s-resize',
                  handle.position === 'left' && 'top-2 bottom-2 left-0 w-1 cursor-w-resize',
                  handle.position === 'right' && 'top-2 right-0 bottom-2 w-1 cursor-e-resize',
                  handle.position === 'top-left' && 'top-0 left-0 h-3 w-3 cursor-nw-resize',
                  handle.position === 'top-right' && 'top-0 right-0 h-3 w-3 cursor-ne-resize',
                  handle.position === 'bottom-left' && 'bottom-0 left-0 h-3 w-3 cursor-sw-resize',
                  handle.position === 'bottom-right' && 'right-0 bottom-0 h-3 w-3 cursor-se-resize',
                  'transition-colors hover:bg-primary/100/20'
                )}
                onMouseDown={(e) => handleResizeStart(e, handle.position)}
              />
            ))}

          {/* Header - Draggable */}
          <div
            className={cn(
              'flex items-center justify-between border-b bg-muted/30',
              !isMaximized && 'cursor-grab active:cursor-grabbing',
              position.width < 500 ? 'px-2 py-1.5' : 'px-4 py-2' // Responsive padding
            )}
            onMouseDown={handleDragStart}
          >
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              {/* Tab Buttons - Responsive layout */}
              <div className='flex shrink-0 items-center gap-1'>
                <button
                  onClick={() => setActiveTab('console')}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-sm transition-all duration-200',
                    'shrink-0 hover:bg-accent/50',
                    activeTab === 'console'
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                    position.width < 500 && 'px-1.5' // Reduce padding on small screens
                  )}
                >
                  <Terminal className={cn('h-4 w-4', position.width < 500 && 'h-3 w-3')} />
                  {position.width >= 450 && 'Console'}
                </button>
                <button
                  onClick={() => setActiveTab('variables')}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-sm transition-all duration-200',
                    'shrink-0 hover:bg-accent/50',
                    activeTab === 'variables'
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                    position.width < 500 && 'px-1.5' // Reduce padding on small screens
                  )}
                >
                  <Variable className={cn('h-4 w-4', position.width < 500 && 'h-3 w-3')} />
                  {position.width >= 450 && 'Variables'}
                </button>
              </div>

              {/* Action Buttons for Console - Hide on very small widths */}
              {activeTab === 'console' && position.width >= 350 && (
                <div className='ml-2 flex items-center gap-1'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => activeWorkflowId && exportConsoleCSV(activeWorkflowId)}
                        className={cn(
                          'rounded p-1.5 transition-colors hover:bg-accent',
                          position.width < 500 && 'p-1'
                        )}
                        title='Export console data'
                      >
                        <ArrowDownToLine
                          className={cn('h-4 w-4', position.width < 500 && 'h-3 w-3')}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Export console data</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => clearConsole(activeWorkflowId)}
                        className={cn(
                          'rounded p-1.5 transition-colors hover:bg-accent',
                          position.width < 500 && 'p-1'
                        )}
                        title='Clear console'
                      >
                        <CircleSlash className={cn('h-4 w-4', position.width < 500 && 'h-3 w-3')} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>Clear console</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            <div className='flex shrink-0 items-center gap-1'>
              <button
                onClick={handleMinimize}
                className={cn(
                  'rounded p-1 transition-colors hover:bg-accent',
                  position.width < 500 && 'p-0.5'
                )}
                title='Minimize'
              >
                <ChevronDown className={cn('h-4 w-4', position.width < 500 && 'h-3 w-3')} />
              </button>
              <button
                onClick={handleMaximize}
                className={cn(
                  'rounded p-1 transition-colors hover:bg-accent',
                  position.width < 500 && 'p-0.5'
                )}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? (
                  <Minimize2 className={cn('h-4 w-4', position.width < 500 && 'h-3 w-3')} />
                ) : (
                  <Maximize2 className={cn('h-4 w-4', position.width < 500 && 'h-3 w-3')} />
                )}
              </button>
              <button
                onClick={handleClose}
                className={cn(
                  'rounded p-1 transition-colors hover:bg-destructive hover:text-destructive-foreground',
                  position.width < 500 && 'p-0.5'
                )}
                title='Close'
              >
                <X className={cn('h-4 w-4', position.width < 500 && 'h-3 w-3')} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div
            className={styles.bottomPanelContent}
            // eslint-disable-next-line react/forbid-dom-props
            style={
              {
                '--content-height': `${position.height - 56}px`, // Reduced from 40 to account for padding
              } as React.CSSProperties
            }
          >
            {activeTab === 'console' ? <Console panelWidth={position.width} /> : <Variables />}
          </div>
        </div>
      )}
    </>
  )
}
