import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSafeStorage } from '@/stores/safe-storage'

const MIN_SIDEBAR_WIDTH = 220
const MAX_SIDEBAR_WIDTH = 480
const DEFAULT_SIDEBAR_WIDTH = 256

const MIN_PANEL_WIDTH = 280
const MAX_PANEL_WIDTH = 600
const DEFAULT_PANEL_WIDTH = 320

interface SidebarState {
  // Track workspace dropdown state
  workspaceDropdownOpen: boolean
  // Sidebar width in pixels (old sidebar - kept for compatibility)
  sidebarWidth: number
  // Advanced sidebar panel width in pixels
  advancedPanelWidth: number
  // Control workspace dropdown state
  setWorkspaceDropdownOpen: (isOpen: boolean) => void
  // Set sidebar width (clamped to min/max)
  setSidebarWidth: (width: number) => void
  // Set advanced sidebar panel width (clamped to min/max)
  setAdvancedPanelWidth: (width: number) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      workspaceDropdownOpen: false,
      sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
      advancedPanelWidth: DEFAULT_PANEL_WIDTH,
      setWorkspaceDropdownOpen: (isOpen) => set({ workspaceDropdownOpen: isOpen }),
      setSidebarWidth: (width) => {
        const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width))
        set({ sidebarWidth: clamped })
      },
      setAdvancedPanelWidth: (width) => {
        const clamped = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width))
        set({ advancedPanelWidth: clamped })
      },
    }),
    {
      name: 'sidebar-state',
      storage: createSafeStorage(),
    }
  )
)

export {
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  DEFAULT_PANEL_WIDTH,
}
