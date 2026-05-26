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

function formatWorkItem(wi: ReturnType<typeof mapWorkItem>): string {
  const assignedStr = wi.assignedTo ? `Assigned To: ${wi.assignedTo}` : 'Unassigned'
  return (
    `#${wi.id}: ${wi.title}\n` +
    `  Type: ${wi.workItemType} | State: ${wi.state}\n` +
    `  ${assignedStr} | Area: ${wi.areaPath}`
  )
}

export const azureDevOpsQueryWorkItemsTool: ToolConfig = {
  id: 'azure_devops_query_work_items',
  name: 'Azure DevOps Query Work Items',
  description:
    'Execute a WIQL query to search for work items in Azure DevOps and return full field details.',
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
    wiql: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description:
        'WIQL query string (e.g. "SELECT [System.Id] FROM WorkItems WHERE [System.State] = \'Active\'")',
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
      `https://dev.azure.com/${params.organization.trim()}/${params.project.trim()}/_apis/wit/wiql?api-version=7.2-preview.2`,
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`:${params.accessToken}`)}`,
    }),
    body: (params) => ({ query: params.wiql }),
  },

  transformResponse: async (response, params) => {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure DevOps error: ${response.status} - ${errorText}`)
    }
    const wiqlData = await response.json()
    const workItemRefs: Array<{ id: number; url: string }> = wiqlData.workItems ?? []

    if (workItemRefs.length === 0) {
      return {
        success: true,
        output: {
          content: 'No work items matched the query.',
          metadata: { count: 0, workItems: [] },
        },
      }
    }

    const allIds = workItemRefs.map((wi) => wi.id)
    const BATCH_SIZE = 200
    const organization = params!.organization.trim()
    const project = params!.project.trim()
    const authHeader = `Basic ${btoa(`:${params!.accessToken}`)}`

    const workItems: ReturnType<typeof mapWorkItem>[] = []
    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
      const chunk = allIds.slice(i, i + BATCH_SIZE)
      const detailsUrl = new URL(
        `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems`
      )
      detailsUrl.searchParams.set('ids', chunk.join(','))
      detailsUrl.searchParams.set('$expand', 'all')
      detailsUrl.searchParams.set('api-version', '7.2-preview.3')

      const detailsResponse = await fetch(detailsUrl.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      })

      if (!detailsResponse.ok) {
        const errorBody = await detailsResponse.text().catch(() => '')
        throw new Error(
          `Failed to fetch work item details (${detailsResponse.status}): ${errorBody || detailsResponse.statusText}`
        )
      }

      const detailsData = await detailsResponse.json()
      for (const raw of detailsData.value ?? []) {
        workItems.push(mapWorkItem(raw as Record<string, unknown>))
      }
    }

    const content =
      workItems.length === 0
        ? 'No work item details found.'
        : `Found ${workItems.length} work item(s):\n\n${workItems.map(formatWorkItem).join('\n\n')}`

    return {
      success: true,
      output: {
        content,
        metadata: { count: workItems.length, totalMatched: allIds.length, workItems },
      },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Human-readable summary of matching work items' },
    metadata: { type: 'json', description: 'Work items metadata including array' },
  },
}
