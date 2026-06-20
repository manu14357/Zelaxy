import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type {
  CodepipelineGetPipelineStateParams,
  CodepipelineResponse,
} from '@/tools/codepipeline/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: CodepipelineGetPipelineStateParams) => ({ name: p.name })

export const getPipelineStateTool: ToolConfig<
  CodepipelineGetPipelineStateParams,
  CodepipelineResponse
> = {
  id: 'codepipeline_get_pipeline_state',
  name: 'CodePipeline Get Pipeline State',
  description: 'Get the current state of an AWS CodePipeline pipeline by name',
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
    name: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The name of the pipeline',
    },
  },

  request: {
    url: (p) => `https://codepipeline.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'codepipeline',
        target: 'CodePipeline_20150709.GetPipelineState',
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
    data: {
      type: 'json',
      description: 'CodePipeline GetPipelineState result (stageStates array)',
    },
  },
}
