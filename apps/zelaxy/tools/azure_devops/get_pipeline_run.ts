import type { ToolConfig } from '@/tools/types'

export const azureDevOpsGetPipelineRunTool: ToolConfig = {
  id: 'azure_devops_get_pipeline_run',
  name: 'Azure DevOps Get Pipeline Run',
  description: 'Get details for a specific pipeline run in Azure DevOps.',
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
    pipelineId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the pipeline',
    },
    runId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ID of the run to retrieve',
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
        `https://dev.azure.com/${params.organization.trim()}/${params.project.trim()}/_apis/pipelines/${params.pipelineId}/runs/${params.runId}`
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
    const run = {
      id: data.id,
      name: data.name,
      state: data.state,
      result: data.result,
      createdDate: data.createdDate,
      finishedDate: data.finishedDate,
      url: data.url,
      webUrl: data._links?.web?.href ?? '',
      pipeline: {
        id: data.pipeline?.id,
        name: data.pipeline?.name,
        folder: data.pipeline?.folder ?? '\\',
        revision: data.pipeline?.revision,
        url: data.pipeline?.url ?? '',
      },
    }

    const resultLine = run.result ? ` | Result: ${run.result}` : ''
    const finishedLine = run.finishedDate ? ` | Finished: ${run.finishedDate}` : ''

    const content =
      `Run: ${run.name} (ID: ${run.id})\n` +
      `Pipeline: ${run.pipeline.name} (ID: ${run.pipeline.id})\n` +
      `State: ${run.state}${resultLine}\n` +
      `Created: ${run.createdDate}${finishedLine}\n` +
      `Web URL: ${run.webUrl}`

    return {
      success: true,
      output: { content, metadata: { run } },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Human-readable summary of the pipeline run' },
    metadata: { type: 'json', description: 'Pipeline run metadata' },
  },
}
