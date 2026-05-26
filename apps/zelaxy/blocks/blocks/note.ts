import { DocumentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface NoteResponse {
  success: boolean
  output: Record<string, never>
}

export const NoteBlock: BlockConfig<NoteResponse> = {
  type: 'note',
  name: 'Note',
  description: 'Add an annotation or comment to your workflow',
  longDescription:
    'A metadata-only block for adding human-readable notes, comments, or documentation within your workflow canvas. Notes have no runtime effect and are skipped during execution.',
  docsLink: '#',
  category: 'blocks',
  bgColor: '#FBBF24',
  icon: DocumentIcon,
  subBlocks: [
    {
      id: 'content',
      title: 'Note',
      type: 'long-input',
      layout: 'full',
      rows: 4,
      placeholder: 'Add a note or comment about this part of the workflow...',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {
    content: {
      type: 'string',
      description: 'The text content of the note',
    },
  },
  outputs: {},
}
