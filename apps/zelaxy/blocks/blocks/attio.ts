import { DollarIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const AttioBlock: BlockConfig = {
  type: 'attio',
  name: 'Attio',
  description: 'Manage records, notes, and tasks in Attio CRM',
  longDescription:
    'Integrate Attio CRM into your workflows. List, get, create, and update records across any object type, plus manage notes and tasks.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1D1E20',
  icon: DollarIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List Records', id: 'attio_list_records' },
        { label: 'Get Record', id: 'attio_get_record' },
        { label: 'Create Record', id: 'attio_create_record' },
        { label: 'Update Record', id: 'attio_update_record' },
        { label: 'Delete Record', id: 'attio_delete_record' },
        { label: 'Create Note', id: 'attio_create_note' },
        { label: 'List Notes', id: 'attio_list_notes' },
      ],
      required: true,
    },
    {
      id: 'credential',
      title: 'Attio Account',
      type: 'oauth-input',
      layout: 'full',
      provider: 'attio',
    },
    {
      id: 'objectType',
      title: 'Object Type',
      type: 'short-input',
      layout: 'full',
      placeholder: 'people',
      required: true,
    },
    {
      id: 'recordId',
      title: 'Record ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'record-id',
      condition: {
        field: 'operation',
        value: ['attio_get_record', 'attio_update_record', 'attio_delete_record'],
      },
    },
    {
      id: 'attributes',
      title: 'Attributes (JSON)',
      type: 'code',
      layout: 'full',
      placeholder: '{"name": "John Doe", "email": "john@example.com"}',
      condition: { field: 'operation', value: ['attio_create_record', 'attio_update_record'] },
    },
    {
      id: 'filter',
      title: 'Filter (JSON)',
      type: 'code',
      layout: 'full',
      placeholder: '{"email_addresses": {"email_address": "john@example.com"}}',
      condition: { field: 'operation', value: ['attio_list_records'] },
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'attio',
      availableTriggers: ['attio_webhook'],
    },
  ],
  tools: {
    access: [
      'attio_list_records',
      'attio_get_record',
      'attio_create_record',
      'attio_update_record',
      'attio_delete_record',
      'attio_create_note',
      'attio_list_notes',
    ],
    config: {
      tool: (params) => params.operation || 'attio_list_records',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    oauthCredential: { type: 'string', description: 'OAuth credential' },
    objectType: { type: 'string', description: 'Object type slug' },
    recordId: { type: 'string', description: 'Record ID' },
    attributes: { type: 'json', description: 'Record attributes' },
    filter: { type: 'json', description: 'Filter criteria' },
  },
  outputs: {
    records: { type: 'json', description: 'Record list' },
    record: { type: 'json', description: 'Record details' },
    notes: { type: 'json', description: 'Notes list' },
    event_type: { type: 'string', description: 'Attio event type (trigger events)' },
    record_id: { type: 'string', description: 'ID of the affected record' },
    object_id: { type: 'string', description: 'Attio object ID' },
    events: { type: 'json', description: 'All batched events' },
  },
  triggers: {
    enabled: true,
    available: ['attio_webhook'],
  },
}
