import {
  JSM_APPROVER_ITEM_PROPERTIES,
  type JsmAnswerApprovalParams,
  type JsmAnswerApprovalResponse,
} from '@/tools/jira_service_management/types'
import type { ToolConfig } from '@/tools/types'

export const jiraServiceManagementAnswerApprovalTool: ToolConfig<
  JsmAnswerApprovalParams,
  JsmAnswerApprovalResponse
> = {
  id: 'jira_service_management_answer_approval',
  name: 'Jira Service Management Answer Approval',
  description: 'Approve or decline an approval request in Jira Service Management',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'jira',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Jira Service Management',
    },
    cloudId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Jira Cloud ID for the instance',
    },
    issueIdOrKey: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Issue ID or key (e.g., SD-123)',
    },
    approvalId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Approval ID to answer',
    },
    decision: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Decision: "approve" or "decline"',
    },
  },

  request: {
    url: (params) =>
      `https://api.atlassian.com/ex/jira/${params.cloudId}/rest/servicedeskapi/request/${encodeURIComponent(params.issueIdOrKey)}/approval/${encodeURIComponent(params.approvalId)}`,
    method: 'POST',
    headers: (params) => ({
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-ExperimentalApi': 'opt-in',
    }),
    body: (params) => ({ decision: params.decision }),
  },

  transformResponse: async (response, params) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        ts: new Date().toISOString(),
        issueIdOrKey: params?.issueIdOrKey ?? '',
        approvalId: params?.approvalId ?? '',
        decision: params?.decision ?? '',
        id: data.id ?? null,
        name: data.name ?? null,
        finalDecision: data.finalDecision ?? null,
        canAnswerApproval: data.canAnswerApproval ?? null,
        approvers: (data.approvers ?? []).map((entry: Record<string, unknown>) => {
          const approver = entry.approver as Record<string, unknown> | undefined
          return {
            approver: {
              accountId: approver?.accountId ?? null,
              displayName: approver?.displayName ?? null,
              emailAddress: approver?.emailAddress ?? null,
              active: approver?.active ?? null,
            },
            approverDecision: entry.approverDecision ?? null,
          }
        }),
        createdDate: data.createdDate ?? null,
        completedDate: data.completedDate ?? null,
        approval: data,
        success: true,
      },
    }
  },

  outputs: {
    ts: { type: 'string', description: 'Timestamp of the operation' },
    issueIdOrKey: { type: 'string', description: 'Issue ID or key' },
    approvalId: { type: 'string', description: 'Approval ID' },
    decision: { type: 'string', description: 'Decision made (approve/decline)' },
    id: { type: 'string', description: 'Approval ID from response', optional: true },
    name: { type: 'string', description: 'Approval description', optional: true },
    finalDecision: {
      type: 'string',
      description: 'Final approval decision: pending, approved, or declined',
      optional: true,
    },
    canAnswerApproval: {
      type: 'boolean',
      description: 'Whether the current user can still respond',
      optional: true,
    },
    approvers: {
      type: 'array',
      description: 'Updated list of approvers with decisions',
      items: {
        type: 'object',
        properties: JSM_APPROVER_ITEM_PROPERTIES,
      },
      optional: true,
    },
    createdDate: { type: 'json', description: 'Approval creation date', optional: true },
    completedDate: { type: 'json', description: 'Approval completion date', optional: true },
    approval: { type: 'json', description: 'The approval object', optional: true },
    success: { type: 'boolean', description: 'Whether the operation succeeded' },
  },
}
