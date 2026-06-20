import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type {
  SecretsManagerCreateSecretParams,
  SecretsManagerResponse,
} from '@/tools/secrets_manager/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: SecretsManagerCreateSecretParams) => ({
  Name: p.name,
  SecretString: p.secretString,
})

export const createSecretTool: ToolConfig<
  SecretsManagerCreateSecretParams,
  SecretsManagerResponse
> = {
  id: 'secrets_manager_create_secret',
  name: 'Secrets Manager Create Secret',
  description: 'Create a new secret in AWS Secrets Manager',
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
      description: 'The name of the new secret',
    },
    secretString: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The secret value to store',
    },
  },

  request: {
    url: (p) => `https://secretsmanager.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'secretsmanager',
        target: 'secretsmanager.CreateSecret',
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
    data: { type: 'json', description: 'Secrets Manager CreateSecret result (ARN, Name, …)' },
  },
}
