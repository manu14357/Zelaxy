import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { PanelStore, PanelTab } from '@/stores/panel/types'
import { createSafeStorage } from '@/stores/safe-storage'

export const usePanelStore = create<PanelStore>()(
  devtools(
    persist(
      (set) => ({
        isOpen: true,
        activeTab: 'properties',
        panelWidth: 308,
        selectedNodeId: null,

        togglePanel: () => {
          set((state) => ({ isOpen: !state.isOpen }))
        },

        setActiveTab: (tab: PanelTab) => {
          set({ activeTab: tab })
        },

        setPanelWidth: (width: number) => {
          // Ensure minimum width of 308px and maximum of 800px
          const clampedWidth = Math.max(308, Math.min(800, width))
          set({ panelWidth: clampedWidth })
        },

        setSelectedNodeId: (nodeId: string | null) => {
          set({ selectedNodeId: nodeId })
        },
      }),
      {
        name: 'panel-store',
        storage: createSafeStorage(),
      }
    )
  )
)
