import { signAwsV4 } from '@/lib/aws/sigv4'
import type { AppConfigListApplicationsParams, AppConfigResponse } from '@/tools/appconfig/types'
import type { ToolConfig } from '@/tools/types'

export const listApplicationsTool: ToolConfig<AppConfigListApplicationsParams, AppConfigResponse> =
  {
    id: 'appconfig_list_applications',
    name: 'AppConfig List Applications',
    description: 'List applications in AWS AppConfig',
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
      url: (p) => `https://appconfig.${p.awsRegion}.amazonaws.com/applications`,
      method: 'GET',
      headers: (p) =>
        signAwsV4({
          method: 'GET',
          url: `https://appconfig.${p.awsRegion}.amazonaws.com/applications`,
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
      data: { type: 'json', description: 'AppConfig ListApplications result (Items, NextToken)' },
    },
  }
