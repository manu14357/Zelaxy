export type PanelTab = 'properties' | 'console' | 'variables' | 'chat' | 'copilot'

export interface PanelStore {
  isOpen: boolean
  activeTab: PanelTab
  panelWidth: number
  selectedNodeId: string | null
  togglePanel: () => void
  setActiveTab: (tab: PanelTab) => void
  setPanelWidth: (width: number) => void
  setSelectedNodeId: (nodeId: string | null) => void
}
