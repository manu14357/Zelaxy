import { LoopIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface LoopBlockOutput {
  success: boolean
  output: {
    iterations: number
    results: any[]
    executionTime: number
    status: 'completed' | 'error' | 'cancelled'
  }
}

export const LoopBlock: BlockConfig<LoopBlockOutput> = {
  type: 'loop',
  name: 'Loop',
  description: 'Execute workflow blocks in a loop iteration',
  longDescription:
    'Container block that executes child workflow blocks in a loop. Supports both count-based loops (for) and collection-based loops (forEach). Child blocks placed inside the loop container will be executed for each iteration.',
  docsLink: '#',
  bgColor: '#F97316',
  icon: LoopIcon,
  category: 'blocks',
  subBlocks: [
    {
      id: 'loopType',
      type: 'dropdown',
      title: 'Loop Type',
      layout: 'half',
      options: [
        { label: 'For Loop (Count)', id: 'for' },
        { label: 'For Each (Collection)', id: 'forEach' },
      ],
    },
    {
      id: 'count',
      type: 'short-input',
      title: 'Iterations',
      layout: 'half',
      placeholder: '5',
      condition: {
        field: 'loopType',
        value: 'for',
      },
    },
    {
      id: 'collection',
      type: 'long-input',
      title: 'Collection Items',
      layout: 'full',
      rows: 3,
      placeholder: "['item1', 'item2', 'item3'] or {{previous_block.output}}",
      description:
        'Array or object to iterate over. Use {{block_id.output}} to reference other blocks.',
      condition: {
        field: 'loopType',
        value: 'forEach',
      },
    },
    {
      id: 'maxIterations',
      type: 'slider',
      title: 'Max Iterations',
      layout: 'full',
      min: 1,
      max: 100,
      description: 'Safety limit to prevent infinite loops',
    },
    {
      id: 'parallelExecution',
      type: 'switch',
      title: 'Parallel Execution',
      layout: 'half',
      description: 'Execute iterations in parallel (faster but uses more resources)',
    },
    {
      id: 'stopOnError',
      type: 'switch',
      title: 'Stop on Error',
      layout: 'half',
      description: 'Stop loop execution if any iteration fails',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {
    collection: {
      type: 'json',
      description: 'Collection of items to iterate over (for forEach loops)',
    },
    count: {
      type: 'number',
      description: 'Number of iterations (for count-based loops)',
    },
  },
  outputs: {
    iterations: {
      type: 'number',
      description: 'Total number of iterations completed',
    },
    results: {
      type: 'json',
      description: 'Array of results from each iteration',
    },
    executionTime: {
      type: 'number',
      description: 'Total execution time in milliseconds',
    },
    status: {
      type: 'string',
      description: 'Loop execution status (completed, error, cancelled)',
    },
    currentIteration: {
      type: 'number',
      description: 'Current iteration number (during execution)',
    },
    currentItem: {
      type: 'json',
      description: 'Current item being processed (for forEach loops)',
    },
  },
}
