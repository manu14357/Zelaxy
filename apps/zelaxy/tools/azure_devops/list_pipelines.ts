import type { ToolConfig } from '@/tools/types'

export const azureDevOpsListPipelinesTool: ToolConfig = {
  id: 'azure_devops_list_pipelines',
  name: 'Azure DevOps List Pipelines',
  description: 'List all pipelines in an Azure DevOps project.',
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
        `https://dev.azure.com/${params.organization.trim()}/${params.project.trim()}/_apis/pipelines`
      )
      url.searchParams.set('api-version', '7.2-preview.1')
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
    const data = await response.json()
    const pipelines: Array<{
      id: number
      name: string
      folder: string
      revision: number
      url: string
    }> = (data.value ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      folder: (p.folder as string) ?? '\\',
      revision: p.revision,
      url: p.url,
    }))

    const content =
      pipelines.length === 0
        ? 'No pipelines found.'
        : `Found ${data.count ?? pipelines.length} pipeline(s):\n\n${pipelines
            .map((p) => `- ${p.name} (ID: ${p.id})\n  Folder: ${p.folder}\n  URL: ${p.url}`)
            .join('\n')}`

    return {
      success: true,
      output: {
        content,
        metadata: { count: data.count ?? pipelines.length, pipelines },
      },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Human-readable summary of pipelines' },
    metadata: { type: 'json', description: 'Pipelines metadata including count and array' },
  },
}
