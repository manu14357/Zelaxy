import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type {
  CodepipelineListPipelinesParams,
  CodepipelineResponse,
} from '@/tools/codepipeline/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (_p: CodepipelineListPipelinesParams) => ({})

export const listPipelinesTool: ToolConfig<CodepipelineListPipelinesParams, CodepipelineResponse> =
  {
    id: 'codepipeline_list_pipelines',
    name: 'CodePipeline List Pipelines',
    description: 'List AWS CodePipeline pipelines in the account',
    version: '1.0.0',

    params: {
      awsRegion: {
        type: 'string',
        required: true,
        visibility: 'user-only',
        description: 'AWS region (e.g. us-east-1)',
      },
      awsAccessKeyId: {
        type: 'string',
        required: true,
        visibility: 'user-only',
        description: 'AWS access key ID',
      },
      awsSecretAccessKey: {
        type: 'string',
        required: true,
        visibility: 'user-only',
        description: 'AWS secret access key',
      },
    },

    request: {
      url: (p) => `https://codepipeline.${p.awsRegion}.amazonaws.com/`,
      method: 'POST',
      headers: (p) =>
        awsJsonHeaders({
          region: p.awsRegion,
          service: 'codepipeline',
          target: 'CodePipeline_20150709.ListPipelines',
          jsonVersion: '1.1',
          accessKeyId: p.awsAccessKeyId,
          secretAccessKey: p.awsSecretAccessKey,
          body: JSON.stringify(buildPayload(p)),
        }),
      body: (p) => buildPayload(p),
    },

    transformResponse: async (response) => {
      const data = await response.json()
      return { success: true, output: { data } }
    },

    outputs: {
      data: { type: 'json', description: 'CodePipeline ListPipelines result (pipelines array)' },
    },
  }
