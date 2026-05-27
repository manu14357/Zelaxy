import { RepeatIcon, SplitIcon } from 'lucide-react'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getAllBlocks } from '@/blocks'
import type { SearchBlockItem, SearchData, SearchDocItem, SearchModalState } from './types'

const initialData: SearchData = {
  blocks: [],
  tools: [],
  triggers: [],
  toolOperations: [],
  docs: [],
  isInitialized: false,
}

export const useSearchModalStore = create<SearchModalState>()(
  devtools(
    (set) => ({
      isOpen: false,
      data: initialData,

      setOpen: (open: boolean) => {
        set({ isOpen: open })
      },

      open: () => {
        set({ isOpen: true })
      },

      close: () => {
        set({ isOpen: false })
      },

      initializeData: (filterBlocks) => {
        const allBlocks = getAllBlocks()
        const filteredAllBlocks = filterBlocks(allBlocks) as typeof allBlocks
        const regularBlocks: SearchBlockItem[] = []
        const tools: SearchBlockItem[] = []
        const docs: SearchDocItem[] = []

        for (const block of filteredAllBlocks) {
          if (block.hideFromToolbar) continue

          const searchItem: SearchBlockItem = {
            id: block.type,
            name: block.name,
            icon: block.icon,
            bgColor: block.bgColor || '#6B7280',
            type: block.type,
            searchValue: `${block.name} ${block.type} block-${block.type}`,
          }

          if (block.category === 'blocks' && block.type !== 'starter') {
            regularBlocks.push(searchItem)
          } else if (block.category === 'tools') {
            tools.push(searchItem)
          }

          if (block.docsLink) {
            docs.push({
              id: `docs-${block.type}`,
              name: block.name,
              icon: block.icon,
              href: block.docsLink,
            })
          }
        }

        const specialBlocks: SearchBlockItem[] = [
          { id: 'loop', name: 'Loop', icon: RepeatIcon, bgColor: '#2FB3FF', type: 'loop' },
          { id: 'parallel', name: 'Parallel', icon: SplitIcon, bgColor: '#FEE12B', type: 'parallel' },
        ]

        const blocks = [...regularBlocks, ...(filterBlocks(specialBlocks) as SearchBlockItem[])]

        set({
          data: {
            blocks,
            tools,
            triggers: [],
            toolOperations: [],
            docs,
            isInitialized: true,
          },
        })
      },
    }),
    { name: 'search-modal-store' }
  )
)
