import { BrexIcon } from '@/components/icons/brex-icon'
import type { BlockConfig } from '@/blocks/types'
import type { BrexResponse } from '@/tools/brex/types'

export const BrexBlock: BlockConfig<BrexResponse> = {
  type: 'brex',
  name: 'Brex',
  description: 'List cash accounts, transactions, and users in Brex',
  longDescription:
    'List cash accounts with balances, list transactions for a cash account, and list users through the Brex API. Authenticate with a Brex user token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#161616',
  icon: BrexIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List cash accounts', id: 'brex_list_cash_accounts' },
        { label: 'List cash transactions', id: 'brex_list_cash_transactions' },
        { label: 'List users', id: 'brex_list_users' },
      ],
      value: () => 'brex_list_cash_accounts',
    },
    // List cash transactions
    {
      id: 'accountId',
      title: 'Cash Account ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Cash account ID',
      condition: { field: 'operation', value: 'brex_list_cash_transactions' },
    },
    {
      id: 'postedAtStart',
      title: 'Posted At Start',
      type: 'short-input',
      layout: 'half',
      placeholder: '2026-01-01T00:00:00',
      condition: { field: 'operation', value: 'brex_list_cash_transactions' },
    },
    // List users
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'user@example.com',
      condition: { field: 'operation', value: 'brex_list_users' },
    },
    // Shared pagination
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
      condition: {
        field: 'operation',
        value: ['brex_list_cash_accounts', 'brex_list_cash_transactions', 'brex_list_users'],
      },
    },
    {
      id: 'cursor',
      title: 'Cursor',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Pagination cursor',
      condition: {
        field: 'operation',
        value: ['brex_list_cash_accounts', 'brex_list_cash_transactions', 'brex_list_users'],
      },
    },
    {
      id: 'apiKey',
      title: 'Brex User Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Brex user token',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['brex_list_cash_accounts', 'brex_list_cash_transactions', 'brex_list_users'],
    config: {
      tool: (params) => params.operation || 'brex_list_cash_accounts',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Brex user token' },
    accountId: { type: 'string', description: 'Cash account ID' },
    postedAtStart: { type: 'string', description: 'ISO 8601 start timestamp' },
    email: { type: 'string', description: 'Filter users by email' },
    limit: { type: 'string', description: 'Result limit' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
  outputs: {
    data: { type: 'json', description: 'Result array from Brex' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
