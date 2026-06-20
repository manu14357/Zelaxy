import { signAwsV4 } from '@/lib/aws/sigv4'
import type { AppConfigListEnvironmentsParams, AppConfigResponse } from '@/tools/appconfig/types'
import type { ToolConfig } from '@/tools/types'

export const listEnvironmentsTool: ToolConfig<AppConfigListEnvironmentsParams, AppConfigResponse> =
  {
    id: 'appconfig_list_environments',
    name: 'AppConfig List Environments',
    description: 'List environments for an AWS AppConfig application',
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
      applicationId: {
        type: 'string',
        required: true,
        visibility: 'user-or-llm',
        description: 'The AppConfig application ID',
      },
    },

    request: {
      url: (p) =>
        `https://appconfig.${p.awsRegion}.amazonaws.com/applications/${p.applicationId}/environments`,
      method: 'GET',
      headers: (p) =>
        signAwsV4({
          method: 'GET',
          url: `https://appconfig.${p.awsRegion}.amazonaws.com/applications/${p.applicationId}/environments`,
          region: p.awsRegion,
          service: 'appconfig',
          accessKeyId: p.awsAccessKeyId,
          secretAccessKey: p.awsSecretAccessKey,
          body: '',
        }),
    },

    transformResponse: async (response) => {
      const data = await response.json()
      return { success: true, output: { data } }
    },

    outputs: {
      data: { type: 'json', description: 'AppConfig ListEnvironments result (Items, NextToken)' },
    },
  }
