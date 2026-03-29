'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToolbarBlock } from '@/app/arena/[workspaceId]/zelaxy/components/sidebar/components/toolbar/components/toolbar-block/toolbar-block'
import LoopToolbarItem from '@/app/arena/[workspaceId]/zelaxy/components/sidebar/components/toolbar/components/toolbar-loop-block/toolbar-loop-block'
import ParallelToolbarItem from '@/app/arena/[workspaceId]/zelaxy/components/sidebar/components/toolbar/components/toolbar-parallel-block/toolbar-parallel-block'
import { getAllBlocks } from '@/blocks'
import type { WorkspaceUserPermissions } from '@/hooks/use-user-permissions'

interface ToolbarProps {
  userPermissions: WorkspaceUserPermissions
  isWorkspaceSelectorVisible?: boolean
}

interface BlockItem {
  name: string
  type: string
  isCustom: boolean
  config?: any
}

export function Toolbar({ userPermissions, isWorkspaceSelectorVisible = false }: ToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const { regularBlocks, specialBlocks, tools, triggers } = useMemo(() => {
    const allBlocks = getAllBlocks()

    // Filter blocks based on search query
    const filteredBlocks = allBlocks.filter((block) => {
      if (block.type === 'starter' || block.hideFromToolbar) return false

      return (
        !searchQuery.trim() ||
        block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })

    // Separate blocks by category: 'blocks', 'tools', and 'triggers'
    const regularBlockConfigs = filteredBlocks.filter((block) => block.category === 'blocks')
    const toolConfigs = filteredBlocks.filter((block) => block.category === 'tools')
    const triggerConfigs = filteredBlocks.filter((block) => block.category === 'triggers')

    // Create regular block items and sort alphabetically
    const regularBlockItems: BlockItem[] = regularBlockConfigs
      .map((block) => ({
        name: block.name,
        type: block.type,
        config: block,
        isCustom: false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Create special blocks (loop and parallel) if they match search
    const specialBlockItems: BlockItem[] = []

    if (!searchQuery.trim() || 'loop'.toLowerCase().includes(searchQuery.toLowerCase())) {
      specialBlockItems.push({
        name: 'Loop',
        type: 'loop',
        isCustom: true,
      })
    }

    if (!searchQuery.trim() || 'parallel'.toLowerCase().includes(searchQuery.toLowerCase())) {
      specialBlockItems.push({
        name: 'Parallel',
        type: 'parallel',
        isCustom: true,
      })
    }

    // Sort special blocks alphabetically
    specialBlockItems.sort((a, b) => a.name.localeCompare(b.name))

    // Create trigger block items and sort alphabetically
    const triggerBlockItems: BlockItem[] = triggerConfigs
      .map((block) => ({
        name: block.name,
        type: block.type,
        config: block,
        isCustom: false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Sort tools alphabetically
    toolConfigs.sort((a, b) => a.name.localeCompare(b.name))

    return {
      regularBlocks: regularBlockItems,
      specialBlocks: specialBlockItems,
      tools: toolConfigs,
      triggers: triggerBlockItems,
    }
  }, [searchQuery])

  return (
    <div className='flex h-full flex-col bg-white dark:bg-gray-900'>
      {/* Clean Header */}
      <div className='flex-shrink-0 border-gray-200 border-b px-4 py-4 dark:border-gray-700'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='font-medium text-gray-900 text-sm dark:text-white'>Nodes</h3>
            <div className='h-1.5 w-1.5 rounded-full bg-green-500' />
          </div>

          <div className='relative'>
            <div className='flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors focus-within:border-gray-300 focus-within:bg-gray-100 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 dark:focus-within:border-gray-600 dark:focus-within:bg-gray-750'>
              <Search className='mr-2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='h-4 flex-1 border-0 bg-transparent px-0 text-gray-900 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white'
                autoComplete='off'
                autoCorrect='off'
                autoCapitalize='off'
                spellCheck='false'
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-gray-600 text-xs transition-colors hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className='flex-1 px-4 py-2' hideScrollbar={true}>
        <div className='space-y-6 pb-4'>
          {/* Core Nodes */}
          {regularBlocks.length > 0 && (
            <div className='space-y-2'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className='font-medium text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400'>
                  Core
                </h4>
                <span className='text-gray-400 text-xs dark:text-gray-500'>
                  {regularBlocks.length}
                </span>
              </div>
              <div className='space-y-1'>
                {regularBlocks.map((block) => (
                  <div key={block.type} className='transition-transform hover:scale-[1.01]'>
                    <ToolbarBlock config={block.config} disabled={!userPermissions.canEdit} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Control Flow */}
          {specialBlocks.length > 0 && (
            <div className='space-y-2'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className='font-medium text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400'>
                  Control
                </h4>
                <span className='text-gray-400 text-xs dark:text-gray-500'>
                  {specialBlocks.length}
                </span>
              </div>
              <div className='space-y-1'>
                {specialBlocks.map((block) => {
                  const Component = block.type === 'loop' ? LoopToolbarItem : ParallelToolbarItem
                  return (
                    <div key={block.type} className='transition-transform hover:scale-[1.01]'>
                      <Component disabled={!userPermissions.canEdit} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Triggers */}
          {triggers.length > 0 && (
            <div className='space-y-2'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className='font-medium text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400'>
                  Triggers
                </h4>
                <span className='text-gray-400 text-xs dark:text-gray-500'>{triggers.length}</span>
              </div>
              <div className='space-y-1'>
                {triggers.map((trigger) => (
                  <div key={trigger.type} className='transition-transform hover:scale-[1.01]'>
                    <ToolbarBlock config={trigger.config} disabled={!userPermissions.canEdit} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {tools.length > 0 && (
            <div className='space-y-2'>
              <div className='mb-3 flex items-center justify-between'>
                <h4 className='font-medium text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400'>
                  Tools
                </h4>
                <span className='text-gray-400 text-xs dark:text-gray-500'>{tools.length}</span>
              </div>
              <div className='space-y-1'>
                {tools.map((tool) => (
                  <div key={tool.type} className='transition-transform hover:scale-[1.01]'>
                    <ToolbarBlock config={tool} disabled={!userPermissions.canEdit} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {regularBlocks.length === 0 &&
            specialBlocks.length === 0 &&
            triggers.length === 0 &&
            tools.length === 0 &&
            searchQuery && (
              <div className='flex flex-col items-center justify-center py-20 text-center'>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800'>
                  <Search className='h-5 w-5 text-gray-400' />
                </div>
                <h3 className='mb-1 font-medium text-gray-900 text-sm dark:text-white'>
                  No results
                </h3>
                <p className='mb-4 text-gray-500 text-xs dark:text-gray-400'>
                  Try a different search term
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className='font-medium text-primary text-xs hover:text-primary dark:text-primary/80 dark:hover:text-primary/70'
                >
                  Show all
                </button>
              </div>
            )}
        </div>
      </ScrollArea>
    </div>
  )
}
