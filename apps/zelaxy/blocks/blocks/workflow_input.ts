import { WorkflowIcon } from '@/components/icons'
import { createLogger } from '@/lib/logs/console/logger'
import type { BlockConfig } from '@/blocks/types'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'

const logger = createLogger('WorkflowInputBlock')

const getAvailableWorkflows = (): Array<{ label: string; id: string }> => {
  try {
    const { workflows, activeWorkflowId } = useWorkflowRegistry.getState()
    return Object.entries(workflows)
      .filter(([id]) => id !== activeWorkflowId)
      .map(([id, workflow]) => ({
        label: (workflow as any).name || `Workflow ${id.slice(0, 8)}`,
        id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    logger.error('Error getting available workflows:', error)
    return []
  }
}

export const WorkflowInputBlock: BlockConfig = {
  type: 'workflow_input',
  name: 'Workflow',
  description: 'Execute another workflow and map variables to its Start trigger schema.',
  longDescription:
    'Execute another child workflow and map variables to its Start trigger schema. Helps with modularizing workflows.',
  category: 'blocks',
  bgColor: '#6366F1',
  icon: WorkflowIcon,
  subBlocks: [
    {
      id: 'workflowId',
      title: 'Select Workflow',
      type: 'dropdown',
      options: getAvailableWorkflows,
      required: true,
    },
    {
      id: 'input',
      title: 'Input Variable (Optional)',
      type: 'short-input',
      placeholder: 'Select a variable to pass to the child workflow',
      description: 'This variable will be available as start.input in the child workflow',
      required: false,
    },
  ],
  tools: {
    access: ['workflow_executor'],
  },
  inputs: {
    workflowId: { type: 'string', description: 'ID of the child workflow' },
    input: { type: 'string', description: 'Variable reference to pass to the child workflow' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Execution success status' },
    childWorkflowName: { type: 'string', description: 'Child workflow name' },
    childWorkflowId: { type: 'string', description: 'Child workflow ID' },
    result: { type: 'json', description: 'Workflow execution result' },
    error: { type: 'string', description: 'Error message' },
    childTraceSpans: { type: 'json', description: 'Child workflow trace spans' },
  },
}
