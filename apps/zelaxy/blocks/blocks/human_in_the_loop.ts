import { UsersIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

interface HumanInTheLoopResponse {
  success: boolean
  output: {
    status: 'approved' | 'rejected' | 'pending' | 'timeout'
    response?: string
    approvedBy?: string
    contextId: string
    resumedAt?: string
  }
}

export const HumanInTheLoopBlock: BlockConfig<HumanInTheLoopResponse> = {
  type: 'human_in_the_loop',
  name: 'Human in the Loop',
  description: 'Pause workflow execution for human review or approval',
  longDescription:
    'Pause workflow execution and wait for a human to review, approve, reject, or provide input before continuing. Supports configurable timeouts and multiple approvers. A unique review link is generated and sent to specified approvers.',
  docsLink: '#',
  category: 'blocks',
  bgColor: '#F59E0B',
  icon: UsersIcon,
  subBlocks: [
    {
      id: 'title',
      title: 'Review Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Approve content before publishing',
      required: true,
    },
    {
      id: 'message',
      title: 'Instructions',
      type: 'long-input',
      layout: 'full',
      rows: 3,
      placeholder: 'Please review the content and approve or reject it.',
      description: 'Instructions displayed to the human reviewer',
    },
    {
      id: 'approvalType',
      title: 'Approval Type',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Approve / Reject', id: 'approve_reject' },
        { label: 'Acknowledge Only', id: 'acknowledge' },
        { label: 'Provide Input', id: 'input' },
      ],
      value: () => 'approve_reject',
    },
    {
      id: 'timeout',
      title: 'Timeout',
      type: 'short-input',
      layout: 'half',
      placeholder: '24',
      description: 'Time before the workflow auto-resumes (0 = no timeout)',
    },
    {
      id: 'timeoutUnit',
      title: 'Timeout Unit',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Minutes', id: 'minutes' },
        { label: 'Hours', id: 'hours' },
        { label: 'Days', id: 'days' },
      ],
      value: () => 'hours',
    },
    {
      id: 'timeoutAction',
      title: 'On Timeout',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Auto-approve', id: 'approve' },
        { label: 'Auto-reject', id: 'reject' },
        { label: 'Fail workflow', id: 'fail' },
      ],
      value: () => 'reject',
      description: 'What to do if the reviewer does not respond before timeout',
    },
    {
      id: 'approvers',
      title: 'Approvers (email, comma-separated)',
      type: 'short-input',
      layout: 'full',
      placeholder: 'alice@example.com, bob@example.com',
      description: 'Email addresses of people who can approve this step',
    },
  ],
  tools: {
    access: [],
  },
  inputs: {
    title: {
      type: 'string',
      description: 'Title of the human review request',
    },
    message: {
      type: 'string',
      description: 'Instructions shown to the human reviewer',
    },
    approvalType: {
      type: 'string',
      description: 'Type of human review: approve_reject, acknowledge, or input',
    },
    timeout: {
      type: 'number',
      description: 'Timeout value (in timeoutUnit units); 0 means no timeout',
    },
    timeoutUnit: {
      type: 'string',
      description: 'Unit for the timeout: minutes, hours, or days',
    },
    timeoutAction: {
      type: 'string',
      description: 'Action on timeout: approve, reject, or fail',
    },
    approvers: {
      type: 'string',
      description: 'Comma-separated email addresses of approvers',
    },
  },
  outputs: {
    status: {
      type: 'string',
      description: 'Review outcome: approved, rejected, pending, or timeout',
    },
    response: {
      type: 'string',
      description: 'Free-text response provided by the reviewer',
    },
    approvedBy: {
      type: 'string',
      description: 'Email of the person who approved or rejected the request',
    },
    contextId: {
      type: 'string',
      description: 'Unique ID for this human review request',
    },
    resumedAt: {
      type: 'string',
      description: 'ISO timestamp when the workflow was resumed',
    },
  },
}
