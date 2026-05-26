import type { ToolConfig } from '@/tools/types'

interface JsonPatchOp {
  op: 'add' | 'replace'
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

export const azureDevOpsCreateWorkItemTool: ToolConfig = {
  id: 'azure_devops_create_work_item',
  name: 'Azure DevOps Create Work Item',
  description: 'Create a new work item in Azure DevOps.',
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
    workItemType: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Work item type to create (e.g. "Issue", "Task", "Epic")',
    },
    title: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Title of the new work item',
    },
    description: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'HTML description of the work item (optional)',
    },
    assignedTo: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Email or display name of the user to assign to (optional)',
    },
    areaPath: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Area path for the work item (optional)',
    },
    tags: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Semicolon-separated tags (optional)',
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
      `https://dev.azure.com/${params.organization.trim()}/${params.project.trim()}/_apis/wit/workitems/$${encodeURIComponent(params.workItemType)}?api-version=7.2-preview.3`,
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json-patch+json',
      Authorization: `Basic ${btoa(`:${params.accessToken}`)}`,
    }),
    body: (params) => {
      const ops: JsonPatchOp[] = [{ op: 'add', path: '/fields/System.Title', value: params.title }]
      if (params.description) {
        ops.push({ op: 'add', path: '/fields/System.Description', value: params.description })
      }
      if (params.assignedTo) {
        ops.push({ op: 'add', path: '/fields/System.AssignedTo', value: params.assignedTo })
      }
      if (params.areaPath) {
        ops.push({ op: 'add', path: '/fields/System.AreaPath', value: params.areaPath })
      }
      if (params.tags) {
        ops.push({ op: 'add', path: '/fields/System.Tags', value: params.tags })
      }
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
        content: `Created work item #${workItem.id}: ${workItem.title}`,
        metadata: { workItem },
      },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Confirmation of the created work item' },
    metadata: { type: 'json', description: 'Created work item metadata' },
  },
}
