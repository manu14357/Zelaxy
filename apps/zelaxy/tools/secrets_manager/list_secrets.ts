import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type {
  SecretsManagerListSecretsParams,
  SecretsManagerResponse,
} from '@/tools/secrets_manager/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: SecretsManagerListSecretsParams) => ({
  MaxResults: p.maxResults ?? 20,
})

export const listSecretsTool: ToolConfig<SecretsManagerListSecretsParams, SecretsManagerResponse> =
  {
    id: 'secrets_manager_list_secrets',
    name: 'Secrets Manager List Secrets',
    description: 'List the secrets stored in AWS Secrets Manager',
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
      maxResults: {
        type: 'number',
        required: false,
        visibility: 'user-or-llm',
        description: 'Maximum number of secrets to return (default 20)',
      },
    },

    request: {
      url: (p) => `https://secretsmanager.${p.awsRegion}.amazonaws.com/`,
      method: 'POST',
      headers: (p) =>
        awsJsonHeaders({
          region: p.awsRegion,
          service: 'secretsmanager',
          target: 'secretsmanager.ListSecrets',
          accessKeyId: p.awsAccessKeyId,
          secretAccessKey: p.awsSecretAccessKey,
          body: JSON.stringify(buildPayload(p)),
          jsonVersion: '1.1',
        }),
      body: (p) => buildPayload(p),
    },

    transformResponse: async (response) => {
      const data = await response.json()
      return { success: true, output: { data } }
    },

    outputs: {
      data: { type: 'json', description: 'Secrets Manager ListSecrets result (SecretList array)' },
    },
  }
