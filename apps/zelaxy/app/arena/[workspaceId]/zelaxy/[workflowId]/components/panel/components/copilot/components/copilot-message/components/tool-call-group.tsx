'use client'

/**
 * Agent-grouped tool calls for the Agie copilot. Consecutive tool calls owned by the same "agent"
 * (Workflow / Research / Files / Tables / Knowledge / Config / Tools) collapse into one named,
 * collapsible group — icon + label + step count — mirroring the ZelaxyArena agent surface. The group
 * auto-expands while the turn is live (or any step is still running / awaiting confirmation) and
 * collapses to a tidy header once every step is terminal; a click pins the state either way.
 */

import { useState } from 'react'
import {
  ChevronDown,
  Database,
  FileText,
  Loader2,
  type LucideIcon,
  Network,
  Search,
  Settings2,
  Table as TableIcon,
  Wrench,
} from 'lucide-react'
import { InlineToolCall, toolVisualStatus } from '@/lib/copilot/tools/inline-tool-call'
import { cn } from '@/lib/utils'
import type { CopilotToolCall } from '@/stores/copilot/types'

export interface AgentInfo {
  id: string
  label: string
  icon: LucideIcon
}

const RESEARCH_TOOLS = new Set([
  'search_online',
  'scrape_page',
  'crawl_website',
  'search_documentation',
  'get_page_contents',
  'deep_research',
])
const FILE_TOOLS = new Set(['create_file', 'append_file', 'write_file', 'manage_file'])
const WORKFLOW_TOOLS = new Set([
  'get_blocks_and_tools',
  'get_blocks_metadata',
  'get_yaml_structure',
  'get_workflow_examples',
])

/** Map a copilot tool id to the named agent that owns it (matches the ZelaxyArena grouping). */
export function agentForCopilotTool(name: string): AgentInfo {
  if (RESEARCH_TOOLS.has(name)) return { id: 'research', label: 'Research Agent', icon: Search }
  if (FILE_TOOLS.has(name)) return { id: 'file', label: 'File Agent', icon: FileText }
  if (name.includes('knowledge'))
    return { id: 'knowledge', label: 'Knowledge Agent', icon: Database }
  if (name.includes('table')) return { id: 'table', label: 'Table Agent', icon: TableIcon }
  if (name.includes('environment') || name.includes('scheduled') || name.includes('variable'))
    return { id: 'config', label: 'Config Agent', icon: Settings2 }
  if (name.includes('workflow') || WORKFLOW_TOOLS.has(name))
    return { id: 'workflow', label: 'Workflow Agent', icon: Network }
  return { id: 'tools', label: 'Tools Agent', icon: Wrench }
}

export function AgentToolGroup({
  agent,
  toolCalls,
  active,
}: {
  agent: AgentInfo
  toolCalls: CopilotToolCall[]
  active: boolean
}) {
  const statuses = toolCalls.map((t) => toolVisualStatus(t.state))
  const anyBusy = statuses.some((s) => s === 'running' || s === 'pending')
  const anyError = statuses.some((s) => s === 'error')

  // Stay expanded for the whole live turn (or while any step is still working / awaiting the user),
  // then auto-collapse to a header once everything is terminal. A click pins the state.
  const [manual, setManual] = useState<boolean | null>(null)
  const expanded = manual ?? (active || anyBusy)
  const Icon = agent.icon

  return (
    <div className='flex flex-col gap-1'>
      <button
        type='button'
        onClick={() => setManual(!expanded)}
        className='flex w-fit cursor-pointer items-center gap-2 text-left'
      >
        <span className='flex size-4 flex-shrink-0 items-center justify-center'>
          {anyBusy ? (
            <Loader2 className='size-[15px] animate-spin text-muted-foreground' />
          ) : (
            <Icon
              className={cn('size-4', anyError ? 'text-destructive' : 'text-muted-foreground')}
            />
          )}
        </span>
        <span className='font-medium text-[13px] text-foreground'>{agent.label}</span>
        {toolCalls.length > 1 && (
          <span className='text-[11px] text-muted-foreground/50 tabular-nums'>
            {toolCalls.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3 w-3 text-muted-foreground/50 transition-transform duration-150',
            !expanded && '-rotate-90'
          )}
        />
      </button>
      {expanded && (
        <div className='ml-[7px] flex flex-col gap-0.5 border-border/40 border-l pl-3'>
          {toolCalls.map((tc) => (
            <InlineToolCall key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  )
}
