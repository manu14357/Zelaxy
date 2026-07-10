/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InlineToolCall, toolVisualStatus } from '@/lib/copilot/tools/inline-tool-call'
import type { CopilotToolCall } from '@/stores/copilot/types'
import { AgentToolGroup, agentForCopilotTool } from './tool-call-group'

const tool = (over: Partial<CopilotToolCall>): CopilotToolCall => ({
  id: 'tc-1',
  name: 'search_online',
  state: 'success',
  ...over,
})

describe('toolVisualStatus', () => {
  it('collapses the fine-grained tool states into coarse visual buckets', () => {
    expect(toolVisualStatus('executing')).toBe('running')
    expect(toolVisualStatus('accepted')).toBe('running')
    expect(toolVisualStatus('success')).toBe('done')
    expect(toolVisualStatus('ready_for_review')).toBe('done')
    expect(toolVisualStatus('errored')).toBe('error')
    expect(toolVisualStatus('rejected')).toBe('skipped')
    expect(toolVisualStatus('pending')).toBe('pending')
  })
})

describe('agentForCopilotTool', () => {
  it('routes each tool to its named agent group', () => {
    expect(agentForCopilotTool('search_online').label).toBe('Research Agent')
    expect(agentForCopilotTool('build_workflow').label).toBe('Workflow Agent')
    expect(agentForCopilotTool('get_blocks_metadata').label).toBe('Workflow Agent')
    expect(agentForCopilotTool('create_file').label).toBe('File Agent')
    expect(agentForCopilotTool('list_tables').label).toBe('Table Agent')
    expect(agentForCopilotTool('set_environment_variables').label).toBe('Config Agent')
  })
})

describe('AgentToolGroup', () => {
  it('renders the agent header and, when active, its tool steps', () => {
    render(
      <AgentToolGroup
        agent={agentForCopilotTool('search_online')}
        toolCalls={[tool({ id: 'a', input: { query: 'weather' } })]}
        active={true}
      />
    )
    expect(screen.getByText('Research Agent')).toBeInTheDocument()
  })

  it('shows a step count when several tools share one agent', () => {
    render(
      <AgentToolGroup
        agent={agentForCopilotTool('get_blocks_metadata')}
        toolCalls={[
          tool({ id: 'a', name: 'get_blocks_metadata' }),
          tool({ id: 'b', name: 'build_workflow' }),
        ]}
        active={true}
      />
    )
    expect(screen.getByText('Workflow Agent')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})

describe('InlineToolCall', () => {
  it('hides tool details until the row is expanded, then reveals arguments and result', () => {
    render(
      <InlineToolCall
        toolCall={tool({
          state: 'success',
          input: { query: 'weather in tokyo' },
          result: { answer: 'sunny' },
        })}
      />
    )

    // Collapsed by default — argument/result values are not in the DOM yet.
    expect(screen.queryByText(/weather in tokyo/)).not.toBeInTheDocument()

    // The single row button toggles the detail panel open.
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('Arguments')).toBeInTheDocument()
    expect(screen.getByText('Result')).toBeInTheDocument()
    expect(screen.getByText(/weather in tokyo/)).toBeInTheDocument()
  })
})
