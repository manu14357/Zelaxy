import type { ToolConfig } from '@/tools/types'

export const azureDevOpsRunPipelineTool: ToolConfig = {
  id: 'azure_devops_run_pipeline',
  name: 'Azure DevOps Run Pipeline',
  description: 'Trigger a pipeline run in Azure DevOps.',
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
      description: 'ID of the pipeline to run',
    },
    branch: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Branch to run the pipeline on (e.g. refs/heads/main)',
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
        `https://dev.azure.com/${params.organization.trim()}/${params.project.trim()}/_apis/pipelines/${params.pipelineId}/runs`
      )
      url.searchParams.set('api-version', '7.2-preview.1')
      return url.toString()
    },
    method: 'POST',
    headers: (params) => ({
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`:${params.accessToken}`)}`,
    }),
    body: (params) => {
      const body: Record<string, unknown> = {}
      if (params.branch) {
        body.resources = { repositories: { self: { refName: params.branch } } }
      }
      return body
    },
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
      url: data.url,
      webUrl: data._links?.web?.href ?? '',
      pipeline: {
        id: data.pipeline?.id,
        name: data.pipeline?.name,
      },
    }

    const content =
      `Triggered run: ${run.name} (ID: ${run.id})\n` +
      `Pipeline: ${run.pipeline.name} (ID: ${run.pipeline.id})\n` +
      `State: ${run.state}\n` +
      `Created: ${run.createdDate}\n` +
      `Web URL: ${run.webUrl}`

    return {
      success: true,
      output: { content, metadata: { run } },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Human-readable summary of the triggered run' },
    metadata: { type: 'json', description: 'Run metadata' },
  },
}
