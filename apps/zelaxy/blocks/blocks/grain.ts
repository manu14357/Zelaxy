import type { SVGProps } from 'react'
import { createElement } from 'react'
import { Mic } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const GrainIcon = (props: SVGProps<SVGSVGElement>) => createElement(Mic, props)

export const GrainBlock: BlockConfig = {
  type: 'grain',
  name: 'Grain',
  description: 'Access meeting recordings, transcripts, and AI summaries',
  longDescription:
    'Integrate Grain into your workflow. Access meeting recordings, transcripts, highlights, and AI-generated summaries.',
  category: 'tools',
  docsLink: 'https://docs.zelaxy.ai/tools/grain',
  icon: GrainIcon,
  bgColor: '#F6FAF9',
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'List Recordings', id: 'grain_list_recordings' },
        { label: 'Get Recording', id: 'grain_get_recording' },
        { label: 'Get Transcript', id: 'grain_get_transcript' },
        { label: 'List Views', id: 'grain_list_views' },
        { label: 'List Teams', id: 'grain_list_teams' },
        { label: 'List Meeting Types', id: 'grain_list_meeting_types' },
        { label: 'Create Webhook', id: 'grain_create_hook' },
        { label: 'List Webhooks', id: 'grain_list_hooks' },
        { label: 'Delete Webhook', id: 'grain_delete_hook' },
      ],
      value: () => 'grain_list_recordings',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      placeholder: 'Enter your Grain API key',
      password: true,
      required: true,
    },
    {
      id: 'recordingId',
      title: 'Recording ID',
      type: 'short-input',
      placeholder: 'Enter recording UUID',
      required: true,
      condition: {
        field: 'operation',
        value: ['grain_get_recording', 'grain_get_transcript'],
      },
    },
    {
      id: 'cursor',
      title: 'Pagination Cursor',
      type: 'short-input',
      placeholder: 'Cursor for next page (optional)',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings'],
      },
    },
    {
      id: 'beforeDatetime',
      title: 'Before Date',
      type: 'short-input',
      placeholder: 'ISO8601 timestamp (e.g., 2024-01-01T00:00:00Z)',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings'],
      },
    },
    {
      id: 'afterDatetime',
      title: 'After Date',
      type: 'short-input',
      placeholder: 'ISO8601 timestamp (e.g., 2024-01-01T00:00:00Z)',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings'],
      },
    },
    {
      id: 'participantScope',
      title: 'Participant Scope',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Internal', id: 'internal' },
        { label: 'External', id: 'external' },
      ],
      value: () => '',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings'],
      },
    },
    {
      id: 'titleSearch',
      title: 'Title Search',
      type: 'short-input',
      placeholder: 'Search by recording title',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings'],
      },
    },
    {
      id: 'teamId',
      title: 'Team ID',
      type: 'short-input',
      placeholder: 'Filter by team UUID (optional)',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings'],
      },
    },
    {
      id: 'meetingTypeId',
      title: 'Meeting Type ID',
      type: 'short-input',
      placeholder: 'Filter by meeting type UUID (optional)',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings'],
      },
    },
    {
      id: 'includeHighlights',
      title: 'Include Highlights',
      type: 'switch',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings', 'grain_get_recording'],
      },
    },
    {
      id: 'includeParticipants',
      title: 'Include Participants',
      type: 'switch',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings', 'grain_get_recording'],
      },
    },
    {
      id: 'includeAiSummary',
      title: 'Include AI Summary',
      type: 'switch',
      condition: {
        field: 'operation',
        value: ['grain_list_recordings', 'grain_get_recording'],
      },
    },
    {
      id: 'viewId',
      title: 'View ID',
      type: 'short-input',
      placeholder: 'Enter Grain view UUID',
      required: true,
      condition: {
        field: 'operation',
        value: ['grain_create_hook'],
      },
    },
    {
      id: 'includeCalendarEvent',
      title: 'Include Calendar Event',
      type: 'switch',
      condition: {
        field: 'operation',
        value: ['grain_get_recording'],
      },
    },
    {
      id: 'includeHubspot',
      title: 'Include HubSpot Data',
      type: 'switch',
      condition: {
        field: 'operation',
        value: ['grain_get_recording'],
      },
    },
    {
      id: 'hookUrl',
      title: 'Webhook URL',
      type: 'short-input',
      placeholder: 'Enter webhook endpoint URL',
      required: true,
      condition: {
        field: 'operation',
        value: ['grain_create_hook'],
      },
    },
    {
      id: 'hookId',
      title: 'Webhook ID',
      type: 'short-input',
      placeholder: 'Enter webhook UUID to delete',
      required: true,
      condition: {
        field: 'operation',
        value: ['grain_delete_hook'],
      },
    },
  ],
  tools: {
    access: [
      'grain_list_recordings',
      'grain_get_recording',
      'grain_get_transcript',
      'grain_list_views',
      'grain_list_teams',
      'grain_list_meeting_types',
      'grain_create_hook',
      'grain_list_hooks',
      'grain_delete_hook',
    ],
    config: {
      tool: (params) => params.operation || 'grain_list_recordings',
      params: (params) => {
        const baseParams: Record<string, unknown> = { apiKey: params.apiKey }

        switch (params.operation) {
          case 'grain_list_recordings':
            return {
              ...baseParams,
              cursor: params.cursor || undefined,
              beforeDatetime: params.beforeDatetime || undefined,
              afterDatetime: params.afterDatetime || undefined,
              participantScope: params.participantScope || undefined,
              titleSearch: params.titleSearch || undefined,
              teamId: params.teamId || undefined,
              meetingTypeId: params.meetingTypeId || undefined,
              includeHighlights: params.includeHighlights || false,
              includeParticipants: params.includeParticipants || false,
              includeAiSummary: params.includeAiSummary || false,
            }
          case 'grain_get_recording':
            return {
              ...baseParams,
              recordingId: params.recordingId,
              includeHighlights: params.includeHighlights || false,
              includeParticipants: params.includeParticipants || false,
              includeAiSummary: params.includeAiSummary || false,
              includeCalendarEvent: params.includeCalendarEvent || false,
              includeHubspot: params.includeHubspot || false,
            }
          case 'grain_get_transcript':
            return { ...baseParams, recordingId: params.recordingId }
          case 'grain_create_hook':
            return {
              ...baseParams,
              hookUrl: params.hookUrl,
              viewId: params.viewId,
            }
          case 'grain_delete_hook':
            return { ...baseParams, hookId: params.hookId }
          default:
            return baseParams
        }
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Grain API key (Personal Access Token)' },
    recordingId: { type: 'string', description: 'Recording UUID' },
    cursor: { type: 'string', description: 'Pagination cursor' },
    viewId: { type: 'string', description: 'Grain view UUID for webhook subscriptions' },
    beforeDatetime: {
      type: 'string',
      description: 'Filter recordings before this ISO8601 timestamp',
    },
    afterDatetime: {
      type: 'string',
      description: 'Filter recordings after this ISO8601 timestamp',
    },
    participantScope: {
      type: 'string',
      description: 'Filter by participant scope (internal/external)',
    },
    titleSearch: { type: 'string', description: 'Search recordings by title' },
    teamId: { type: 'string', description: 'Filter by team UUID' },
    meetingTypeId: { type: 'string', description: 'Filter by meeting type UUID' },
    includeHighlights: { type: 'boolean', description: 'Include highlights in response' },
    includeParticipants: { type: 'boolean', description: 'Include participants in response' },
    includeAiSummary: { type: 'boolean', description: 'Include AI summary in response' },
    includeCalendarEvent: { type: 'boolean', description: 'Include calendar event in response' },
    includeHubspot: { type: 'boolean', description: 'Include HubSpot data in response' },
    hookUrl: { type: 'string', description: 'Webhook endpoint URL' },
    hookId: { type: 'string', description: 'Webhook UUID to delete' },
  },
  outputs: {
    recordings: { type: 'json', description: 'List of recordings' },
    recording: { type: 'json', description: 'Single recording details' },
    transcript: { type: 'json', description: 'Recording transcript' },
    views: { type: 'json', description: 'List of views' },
    teams: { type: 'json', description: 'List of teams' },
    meetingTypes: { type: 'json', description: 'List of meeting types' },
    hooks: { type: 'json', description: 'List of webhooks' },
    hook: { type: 'json', description: 'Created webhook details' },
  },
}
