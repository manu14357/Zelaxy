import { ChartBarIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const FathomBlock: BlockConfig = {
  type: 'fathom',
  name: 'Fathom',
  description: 'Retrieve meeting transcripts and summaries from Fathom',
  longDescription:
    'Integrate Fathom AI meeting recorder into your workflows. List meetings, retrieve transcripts, and get AI-generated summaries.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#181C1E',
  icon: ChartBarIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List Meetings', id: 'fathom_list_meetings' },
        { label: 'Get Summary', id: 'fathom_get_summary' },
        { label: 'Get Transcript', id: 'fathom_get_transcript' },
        { label: 'List Team Members', id: 'fathom_list_team_members' },
        { label: 'List Teams', id: 'fathom_list_teams' },
      ],
      required: true,
    },
    {
      id: 'recordingId',
      title: 'Recording ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'recording-id',
      condition: { field: 'operation', value: ['fathom_get_summary', 'fathom_get_transcript'] },
    },
    {
      id: 'includeSummary',
      title: 'Include Summary',
      type: 'switch',
      layout: 'half',
      condition: { field: 'operation', value: ['fathom_list_meetings'] },
    },
    {
      id: 'includeTranscript',
      title: 'Include Transcript',
      type: 'switch',
      layout: 'half',
      condition: { field: 'operation', value: ['fathom_list_meetings'] },
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'fathom',
      availableTriggers: ['fathom_webhook'],
    },
  ],
  tools: {
    access: [
      'fathom_list_meetings',
      'fathom_get_summary',
      'fathom_get_transcript',
      'fathom_list_team_members',
      'fathom_list_teams',
    ],
    config: {
      tool: (params) => params.operation || 'fathom_list_meetings',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    recordingId: { type: 'string', description: 'Recording ID' },
    includeSummary: { type: 'boolean', description: 'Include summary' },
    includeTranscript: { type: 'boolean', description: 'Include transcript' },
  },
  outputs: {
    meetings: { type: 'json', description: 'Meeting list' },
    summary: { type: 'string', description: 'Meeting summary' },
    transcript: { type: 'string', description: 'Meeting transcript' },
    event_type: { type: 'string', description: 'Fathom event type (trigger events)' },
    meeting_id: { type: 'string', description: 'Meeting ID' },
    meeting_title: { type: 'string', description: 'Meeting title' },
  },
  triggers: {
    enabled: true,
    available: ['fathom_webhook'],
  },
}
