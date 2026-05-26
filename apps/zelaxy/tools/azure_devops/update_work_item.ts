import type { ToolConfig } from '@/tools/types'

interface JsonPatchOp {
  op: 'replace'
  path: string
  value: unknown
}

function mapWorkItem(raw: Record<string, unknown>) {
  const fields = (raw.fields ?? {}) as Record<string, unknown>
  const assignedToRaw = fields['System.AssignedTo']
  const assignedTo =
    assignedToRaw && typeof assignedToRaw === 'object'
      ? (((assignedToRaw as Record<string, unknown>).displayName as string) ?? null)
      : ((assignedToRaw as string) ?? null)

  return {
    id: raw.id as number,
    title: fields['System.Title'] as string,
    state: fields['System.State'] as string,
    workItemType: fields['System.WorkItemType'] as string,
    assignedTo,
    areaPath: fields['System.AreaPath'] as string,
    url: raw.url as string,
  }
}

export const azureDevOpsUpdateWorkItemTool: ToolConfig = {
  id: 'azure_devops_update_work_item',
  name: 'Azure DevOps Update Work Item',
  description: 'Update one or more fields on an existing work item in Azure DevOps.',
  version: '1.0.0',

  params: {
    organization: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Azure DevOps organization name',
    },
    project: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Azure DevOps project name',
    },
    workItemId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the work item to update',
    },
    title: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New title for the work item (optional)',
    },
    description: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New HTML description (optional)',
    },
    assignedTo: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email or display name to reassign to (optional)',
    },
    state: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New state (e.g. "To Do", "Doing", "Done") (optional)',
    },
    areaPath: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New area path (optional)',
    },
    tags: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Semicolon-separated tags to set (optional)',
    },
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Azure DevOps Personal Access Token',
    },
  },

  request: {
    url: (params) =>
      `https://dev.azure.com/${params.organization.trim()}/${params.project.trim()}/_apis/wit/workitems/${params.workItemId}?api-version=7.2-preview.3`,
    method: 'PATCH',
    headers: (params) => ({
      'Content-Type': 'application/json-patch+json',
      Authorization: `Basic ${btoa(`:${params.accessToken}`)}`,
    }),
    body: (params) => {
      const ops: JsonPatchOp[] = []
      if (
        !params.title &&
        !params.description &&
        !params.assignedTo &&
        !params.state &&
        !params.areaPath &&
        !params.tags
      ) {
        throw new Error('Update Work Item requires at least one field to update.')
      }
      if (params.title)
        ops.push({ op: 'replace', path: '/fields/System.Title', value: params.title })
      if (params.description)
        ops.push({ op: 'replace', path: '/fields/System.Description', value: params.description })
      if (params.assignedTo)
        ops.push({ op: 'replace', path: '/fields/System.AssignedTo', value: params.assignedTo })
      if (params.state)
        ops.push({ op: 'replace', path: '/fields/System.State', value: params.state })
      if (params.areaPath)
        ops.push({ op: 'replace', path: '/fields/System.AreaPath', value: params.areaPath })
      if (params.tags) ops.push({ op: 'replace', path: '/fields/System.Tags', value: params.tags })
      return ops
    },
  },

  transformResponse: async (response) => {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure DevOps error: ${response.status} - ${errorText}`)
    }
    const raw = await response.json()
    const workItem = mapWorkItem(raw as Record<string, unknown>)

    return {
      success: true,
      output: {
        content: `Updated work item #${workItem.id}: ${workItem.title}`,
        metadata: { workItem },
      },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Confirmation of the updated work item' },
    metadata: { type: 'json', description: 'Updated work item metadata' },
  },
}
