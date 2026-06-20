import { signAwsV4 } from '@/lib/aws/sigv4'
import type {
  AppConfigListConfigurationProfilesParams,
  AppConfigResponse,
} from '@/tools/appconfig/types'
import type { ToolConfig } from '@/tools/types'

export const listConfigurationProfilesTool: ToolConfig<
  AppConfigListConfigurationProfilesParams,
  AppConfigResponse
> = {
  id: 'appconfig_list_configuration_profiles',
  name: 'AppConfig List Configuration Profiles',
  description: 'List configuration profiles for an AWS AppConfig application',
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
      `https://appconfig.${p.awsRegion}.amazonaws.com/applications/${p.applicationId}/configurationprofiles`,
    method: 'GET',
    headers: (p) =>
      signAwsV4({
        method: 'GET',
        url: `https://appconfig.${p.awsRegion}.amazonaws.com/applications/${p.applicationId}/configurationprofiles`,
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
    data: {
      type: 'json',
      description: 'AppConfig ListConfigurationProfiles result (Items, NextToken)',
    },
  },
}
