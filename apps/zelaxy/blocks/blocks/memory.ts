import { BrainIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const MemoryBlock: BlockConfig = {
  type: 'memory',
  name: 'Memory Storage',
  description: 'Persistent data management system',
  longDescription:
    'Advanced memory management system for storing, retrieving, and managing persistent data across workflow executions. Supports conversation history, data caching, and intelligent retrieval with filtering options.',
  bgColor: '#F64F9E',
  icon: BrainIcon,
  category: 'blocks',
  docsLink: '#',
  subBlocks: [
    {
      id: 'operation',
      title: 'Memory Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Store New Data', id: 'add' },
        { label: 'Retrieve All Records', id: 'getAll' },
        { label: 'Fetch Specific Record', id: 'get' },
        { label: 'Remove Record', id: 'delete' },
      ],
      placeholder: 'Choose memory operation type',
      value: () => 'add',
    },
    {
      id: 'id',
      title: 'Record Identifier',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter unique identifier for storage',
      condition: {
        field: 'operation',
        value: 'add',
      },
      required: true,
    },
    {
      id: 'id',
      title: 'Record Identifier',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter identifier of record to retrieve',
      condition: {
        field: 'operation',
        value: 'get',
      },
      required: true,
    },
    {
      id: 'limit',
      title: 'Retrieval Limit',
      type: 'slider',
      layout: 'half',
      min: 1,
      max: 100,
      step: 1,
      integer: true,
      value: () => '10',
      placeholder: 'Maximum number of messages to retrieve',
      condition: {
        field: 'operation',
        value: 'get',
      },
    },
    {
      id: 'sortOrder',
      title: 'Sort Order',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Newest First', id: 'desc' },
        { label: 'Oldest First', id: 'asc' },
      ],
      placeholder: 'Choose sort direction',
      condition: {
        field: 'operation',
        value: 'get',
      },
    },
    {
      id: 'id',
      title: 'Record Identifier',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter identifier of record to remove',
      condition: {
        field: 'operation',
        value: 'delete',
      },
      required: true,
    },
    {
      id: 'role',
      title: 'Message Role',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Human Input', id: 'user' },
        { label: 'AI Response', id: 'assistant' },
        { label: 'System Instruction', id: 'system' },
      ],
      placeholder: 'Select message role type',
      condition: {
        field: 'operation',
        value: 'add',
      },
      required: true,
    },
    {
      id: 'content',
      title: 'Data Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter the content to store in memory',
      condition: {
        field: 'operation',
        value: 'add',
      },
      required: true,
    },
    {
      id: 'limit',
      title: 'Retrieval Limit',
      type: 'slider',
      layout: 'full',
      min: 1,
      max: 100,
      step: 1,
      integer: true,
      value: () => '10',
      placeholder: 'Maximum number of messages per record to retrieve',
      condition: {
        field: 'operation',
        value: 'getAll',
      },
    },
    {
      id: 'sortOrder',
      title: 'Sort Order',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Newest First', id: 'desc' },
        { label: 'Oldest First', id: 'asc' },
      ],
      placeholder: 'Choose sort direction',
      condition: {
        field: 'operation',
        value: 'getAll',
      },
    },
    {
      id: 'filterType',
      title: 'Filter by Type',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'All Types', id: 'all' },
        { label: 'Human Input Only', id: 'user' },
        { label: 'AI Response Only', id: 'assistant' },
        { label: 'System Instructions Only', id: 'system' },
      ],
      placeholder: 'Filter records by message type',
      condition: {
        field: 'operation',
        value: 'getAll',
      },
    },
  ],
  tools: {
    access: ['memory_add', 'memory_get', 'memory_get_all', 'memory_delete'],
    config: {
      tool: (params: Record<string, any>) => {
        const operation = params.operation || 'add'
        switch (operation) {
          case 'add':
            return 'memory_add'
          case 'get':
            return 'memory_get'
          case 'getAll':
            return 'memory_get_all'
          case 'delete':
            return 'memory_delete'
          default:
            return 'memory_add'
        }
      },
      params: (params: Record<string, any>) => {
        // Create detailed error information for any missing required fields
        const errors: string[] = []

        if (!params.operation) {
          errors.push('Memory operation is required')
        }

        if (
          params.operation === 'add' ||
          params.operation === 'get' ||
          params.operation === 'delete'
        ) {
          if (!params.id) {
            errors.push(`Record identifier is required for ${params.operation} operation`)
          }
        }

        if (params.operation === 'add') {
          if (!params.role) {
            errors.push('Message role is required for data storage')
          }
          if (!params.content) {
            errors.push('Data content is required for storage operation')
          }
        }

        // Throw error if any required fields are missing
        if (errors.length > 0) {
          throw new Error(`Memory Storage Error: ${errors.join(', ')}`)
        }

        // Base result object
        const baseResult: Record<string, any> = {}

        // For add operation
        if (params.operation === 'add') {
          const result: Record<string, any> = {
            ...baseResult,
            id: params.id,
            type: 'agent', // Always agent type
            role: params.role,
            content: params.content,
          }

          return result
        }

        // For get operation
        if (params.operation === 'get') {
          const getResult: Record<string, any> = {
            ...baseResult,
            id: params.id,
          }

          // Add limit if specified
          if (params.limit && Number.parseInt(params.limit) > 0) {
            getResult.limit = Number.parseInt(params.limit)
          }

          // Add sort order if specified
          if (params.sortOrder) {
            getResult.sortOrder = params.sortOrder
          }

          return getResult
        }

        // For delete operation
        if (params.operation === 'delete') {
          return {
            ...baseResult,
            id: params.id,
          }
        }

        // For getAll operation
        const getAllResult: Record<string, any> = { ...baseResult }

        // Add limit if specified
        if (params.limit && Number.parseInt(params.limit) > 0) {
          getAllResult.limit = Number.parseInt(params.limit)
        }

        // Add sort order if specified
        if (params.sortOrder) {
          getAllResult.sortOrder = params.sortOrder
        }

        // Add filter type if specified and not 'all'
        if (params.filterType && params.filterType !== 'all') {
          getAllResult.filterType = params.filterType
        }

        return getAllResult
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Memory operation type to execute' },
    id: { type: 'string', description: 'Unique record identifier' },
    role: { type: 'string', description: 'Message role classification' },
    content: { type: 'string', description: 'Data content to store' },
    limit: { type: 'number', description: 'Maximum number of messages per record to retrieve' },
    sortOrder: { type: 'string', description: 'Sort direction for retrieved records' },
    filterType: { type: 'string', description: 'Filter records by message role type' },
  },
  outputs: {
    memories: { type: 'json', description: 'Retrieved memory records with metadata' },
    id: { type: 'string', description: 'Processed record identifier' },
    count: { type: 'number', description: 'Number of records processed' },
    success: { type: 'boolean', description: 'Operation completion status' },
  },
}
