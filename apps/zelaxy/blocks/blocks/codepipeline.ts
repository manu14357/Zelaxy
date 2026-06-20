import { CodepipelineIcon } from '@/components/icons/codepipeline-icon'
import type { BlockConfig } from '@/blocks/types'
import type { CodepipelineResponse } from '@/tools/codepipeline/types'

export const CodepipelineBlock: BlockConfig<CodepipelineResponse> = {
  type: 'codepipeline',
  name: 'AWS CodePipeline',
  description: 'List pipelines, get pipeline structure, and inspect pipeline state',
  longDescription:
    'Interact with AWS CodePipeline: list pipelines, get a pipeline structure, and get a pipeline state. Authenticate with AWS access key credentials (SigV4 signed).',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4D27A8',
  icon: CodepipelineIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List pipelines', id: 'codepipeline_list_pipelines' },
        { label: 'Get pipeline', id: 'codepipeline_get_pipeline' },
        { label: 'Get pipeline state', id: 'codepipeline_get_pipeline_state' },
      ],
      value: () => 'codepipeline_list_pipelines',
    },
    {
      id: 'name',
      title: 'Pipeline Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'my-pipeline',
      condition: {
        field: 'operation',
        value: ['codepipeline_get_pipeline', 'codepipeline_get_pipeline_state'],
      },
    },
    {
      id: 'awsRegion',
      title: 'AWS Region',
      type: 'short-input',
      layout: 'half',
      placeholder: 'us-east-1',
      required: true,
    },
    {
      id: 'awsAccessKeyId',
      title: 'AWS Access Key ID',
      type: 'short-input',
      layout: 'half',
      password: true,
      required: true,
    },
    {
      id: 'awsSecretAccessKey',
      title: 'AWS Secret Access Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'codepipeline_list_pipelines',
      'codepipeline_get_pipeline',
      'codepipeline_get_pipeline_state',
    ],
    config: {
      tool: (params) => params.operation || 'codepipeline_list_pipelines',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    awsRegion: { type: 'string', description: 'AWS region' },
    awsAccessKeyId: { type: 'string', description: 'AWS access key ID' },
    awsSecretAccessKey: { type: 'string', description: 'AWS secret access key' },
    name: { type: 'string', description: 'Pipeline name' },
  },
  outputs: {
    data: { type: 'json', description: 'CodePipeline API response' },
  },
}
