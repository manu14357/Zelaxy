import { ParallelIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface ParallelBlockOutput {
  success: boolean
  output: {
    executions: number
    results: any[]
    executionTime: number
    status: 'completed' | 'error' | 'cancelled'
  }
}

export const ParallelBlock: BlockConfig<ParallelBlockOutput> = {
  type: 'parallel',
  name: 'Parallel',
  description: 'Execute workflow blocks in parallel',
  longDescription:
    'Container block that executes child workflow blocks in parallel. Supports both count-based parallel execution and collection-based distribution. Child blocks placed inside the parallel container will be executed concurrently.',
  docsLink: '#',
  bgColor: '#FEE12B',
  icon: ParallelIcon,
  category: 'blocks',
  subBlocks: [
    {
      id: 'parallelType',
      type: 'dropdown',
      title: 'Parallel Type',
      layout: 'half',
      options: [
        { label: 'Parallel Count', id: 'count' },
        { label: 'Parallel Each (Collection)', id: 'collection' },
      ],
    },
    {
      id: 'count',
      type: 'short-input',
      title: 'Parallel Executions',
      layout: 'half',
      placeholder: '3',
      condition: {
        field: 'parallelType',
        value: 'count',
      },
    },
    {
      id: 'collection',
      type: 'long-input',
      title: 'Distribution Items',
      layout: 'full',
      rows: 3,
      placeholder: "['item1', 'item2', 'item3'] or {{previous_block.output}}",
      description:
        'Array or object to distribute across parallel executions. Use {{block_id.output}} to reference other blocks.',
      condition: {
        field: 'parallelType',
        value: 'collection',
      },
    },
    {
      id: 'maxConcurrency',
      type: 'slider',
      title: 'Max Concurrency',
      layout: 'full',
      min: 1,
      max: 20,
      description: 'Maximum number of parallel executions running at once',
    },
    {
      id: 'waitForAll',
      type: 'switch',
      title: 'Wait for All',
      layout: 'half',
      description: 'Wait for all parallel executions to complete before continuing',
    },
    {
      id: 'stopOnError',
      type: 'switch',
      title: 'Stop on Error',
      layout: 'half',
      description: 'Stop all parallel executions if any execution fails',
    },
    {
      id: 'timeout',
      type: 'short-input',
      title: 'Timeout (seconds)',
      layout: 'half',
      placeholder: '300',
      description: 'Maximum time to wait for all executions to complete',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {
    collection: {
      type: 'json',
      description: 'Collection of items to distribute across parallel executions',
    },
    count: {
      type: 'number',
      description: 'Number of parallel executions',
    },
  },
  outputs: {
    executions: {
      type: 'number',
      description: 'Total number of parallel executions completed',
    },
    results: {
      type: 'json',
      description: 'Array of results from each parallel execution',
    },
    executionTime: {
      type: 'number',
      description: 'Total execution time in milliseconds',
    },
    status: {
      type: 'string',
      description: 'Parallel execution status (completed, error, cancelled)',
    },
    currentExecution: {
      type: 'number',
      description: 'Current execution number (during execution)',
    },
    currentItem: {
      type: 'json',
      description: 'Current item being processed (for collection-based parallel execution)',
    },
  },
}
