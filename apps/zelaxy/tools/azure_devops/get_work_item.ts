import type { ToolConfig } from '@/tools/types'

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

export const azureDevOpsGetWorkItemTool: ToolConfig = {
  id: 'azure_devops_get_work_item',
  name: 'Azure DevOps Get Work Item',
  description: 'Fetch full details of a single work item by ID from Azure DevOps.',
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
      description: 'The work item ID to fetch',
    },
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Azure DevOps Personal Access Token',
    },
  },

  request: {
    url: (params) => {
      const url = new URL(
        `https://dev.azure.com/${params.organization.trim()}/${params.project.trim()}/_apis/wit/workitems/${params.workItemId}`
      )
      url.searchParams.set('$expand', 'all')
      url.searchParams.set('api-version', '7.2-preview.3')
      return url.toString()
    },
    method: 'GET',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`:${params.accessToken}`)}`,
    }),
  },

  transformResponse: async (response) => {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure DevOps error: ${response.status} - ${errorText}`)
    }
    const raw = await response.json()
    const workItem = mapWorkItem(raw as Record<string, unknown>)

    const assignedStr = workItem.assignedTo ? `Assigned To: ${workItem.assignedTo}` : 'Unassigned'
    const content =
      `#${workItem.id}: ${workItem.title}\n` +
      `  Type: ${workItem.workItemType} | State: ${workItem.state}\n` +
      `  ${assignedStr} | Area: ${workItem.areaPath}`

    return {
      success: true,
      output: { content, metadata: { workItem } },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Human-readable summary of the work item' },
    metadata: { type: 'json', description: 'Work item metadata' },
  },
}
