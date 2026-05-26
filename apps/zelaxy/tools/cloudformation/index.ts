import type { ToolConfig } from '@/tools/types'

const awsParams = {
  awsRegion: {
    type: 'string' as const,
    required: true,
    visibility: 'user-only' as const,
    description: 'AWS region (e.g., us-east-1)',
  },
  awsAccessKeyId: {
    type: 'string' as const,
    required: true,
    visibility: 'user-only' as const,
    description: 'AWS access key ID',
  },
  awsSecretAccessKey: {
    type: 'string' as const,
    required: true,
    visibility: 'user-only' as const,
    description: 'AWS secret access key',
  },
}

const awsHeaders = { 'Content-Type': 'application/json' }

export const cloudformationDescribeStacksTool: ToolConfig = {
  id: 'cloudformation_describe_stacks',
  name: 'CloudFormation Describe Stacks',
  description: 'List and describe CloudFormation stacks.',
  version: '1.0.0',
  params: {
    ...awsParams,
    stackName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Stack name or ID to describe (omit to list all stacks)',
    },
  },
  request: {
    url: '/api/tools/cloudformation/describe-stacks',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      ...(params.stackName && { stackName: params.stackName }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: { stacks: unknown[] } }
    if (!response.ok) throw new Error(data.error || 'Failed to describe CloudFormation stacks')
    return { success: true, output: { stacks: data.output?.stacks } }
  },
  outputs: { stacks: { type: 'array', description: 'List of CloudFormation stacks' } },
}

export const cloudformationListStackResourcesTool: ToolConfig = {
  id: 'cloudformation_list_stack_resources',
  name: 'CloudFormation List Stack Resources',
  description: 'List all resources in a CloudFormation stack.',
  version: '1.0.0',
  params: {
    ...awsParams,
    stackName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Stack name or ID',
    },
  },
  request: {
    url: '/api/tools/cloudformation/list-stack-resources',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      stackName: params.stackName,
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: { resources: unknown[] } }
    if (!response.ok) throw new Error(data.error || 'Failed to list CloudFormation stack resources')
    return { success: true, output: { resources: data.output?.resources } }
  },
  outputs: { resources: { type: 'array', description: 'List of stack resources' } },
}

export const cloudformationDescribeStackEventsTool: ToolConfig = {
  id: 'cloudformation_describe_stack_events',
  name: 'CloudFormation Describe Stack Events',
  description: 'Get the event history for a CloudFormation stack.',
  version: '1.0.0',
  params: {
    ...awsParams,
    stackName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Stack name or ID',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of events to return (default: 50)',
    },
  },
  request: {
    url: '/api/tools/cloudformation/describe-stack-events',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      stackName: params.stackName,
      ...(params.limit !== undefined && { limit: params.limit }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: { events: unknown[] } }
    if (!response.ok)
      throw new Error(data.error || 'Failed to describe CloudFormation stack events')
    return { success: true, output: { events: data.output?.events } }
  },
  outputs: { events: { type: 'array', description: 'List of stack events' } },
}

export const cloudformationDetectStackDriftTool: ToolConfig = {
  id: 'cloudformation_detect_stack_drift',
  name: 'CloudFormation Detect Stack Drift',
  description: 'Initiate drift detection on a CloudFormation stack.',
  version: '1.0.0',
  params: {
    ...awsParams,
    stackName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Stack name or ID to detect drift on',
    },
  },
  request: {
    url: '/api/tools/cloudformation/detect-stack-drift',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      stackName: params.stackName,
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as {
      error?: string
      output?: { stackDriftDetectionId: string }
    }
    if (!response.ok) throw new Error(data.error || 'Failed to detect CloudFormation stack drift')
    return { success: true, output: { stackDriftDetectionId: data.output?.stackDriftDetectionId } }
  },
  outputs: {
    stackDriftDetectionId: { type: 'string', description: 'ID to check drift detection status' },
  },
}

export const cloudformationGetTemplateTool: ToolConfig = {
  id: 'cloudformation_get_template',
  name: 'CloudFormation Get Template',
  description: 'Retrieve the template body for a CloudFormation stack.',
  version: '1.0.0',
  params: {
    ...awsParams,
    stackName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Stack name or ID',
    },
  },
  request: {
    url: '/api/tools/cloudformation/get-template',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      stackName: params.stackName,
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as {
      error?: string
      output?: { templateBody: string; stagesAvailable: string[] }
    }
    if (!response.ok) throw new Error(data.error || 'Failed to get CloudFormation template')
    return {
      success: true,
      output: {
        templateBody: data.output?.templateBody,
        stagesAvailable: data.output?.stagesAvailable,
      },
    }
  },
  outputs: {
    templateBody: { type: 'string', description: 'The template body as JSON or YAML' },
    stagesAvailable: { type: 'array', description: 'Available template stages' },
  },
}

export const cloudformationValidateTemplateTool: ToolConfig = {
  id: 'cloudformation_validate_template',
  name: 'CloudFormation Validate Template',
  description: 'Validate a CloudFormation template for syntax and structural correctness.',
  version: '1.0.0',
  params: {
    ...awsParams,
    templateBody: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The CloudFormation template body (JSON or YAML)',
    },
  },
  request: {
    url: '/api/tools/cloudformation/validate-template',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      templateBody: params.templateBody,
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: unknown }
    if (!response.ok) throw new Error(data.error || 'Failed to validate CloudFormation template')
    return { success: true, output: data.output }
  },
  outputs: {
    description: { type: 'string', description: 'Template description' },
    parameters: { type: 'array', description: 'Template parameters' },
    capabilities: { type: 'array', description: 'Required capabilities' },
  },
}
