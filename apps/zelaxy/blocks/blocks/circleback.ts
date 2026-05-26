import { ConnectIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const CirclebackBlock: BlockConfig = {
  type: 'circleback',
  name: 'Circleback',
  description: 'Trigger workflows from Circleback meeting completions and notes',
  longDescription:
    'Integrate Circleback AI meeting assistant into your workflows. Receive meeting data, notes, action items, and transcripts when meetings complete.',
  docsLink: '#',
  category: 'triggers',
  bgColor: '#0097A7',
  icon: ConnectIcon,
  subBlocks: [],
  tools: {
    access: [],
  },
  inputs: {},
  outputs: {
    id: { type: 'number', description: 'Meeting ID' },
    name: { type: 'string', description: 'Meeting name' },
    url: { type: 'string', description: 'Meeting URL' },
    createdAt: { type: 'string', description: 'Created at timestamp' },
    duration: { type: 'number', description: 'Meeting duration in minutes' },
    recordingUrl: { type: 'string', description: 'Recording URL' },
    attendees: { type: 'json', description: 'Meeting attendees' },
    notes: { type: 'string', description: 'Meeting notes' },
    actionItems: { type: 'json', description: 'Action items' },
    transcript: { type: 'json', description: 'Meeting transcript' },
    meeting: { type: 'json', description: 'Full meeting data' },
  },
  triggers: {
    enabled: true,
    available: ['circleback_meeting_completed', 'circleback_meeting_notes', 'circleback_webhook'],
  },
}
