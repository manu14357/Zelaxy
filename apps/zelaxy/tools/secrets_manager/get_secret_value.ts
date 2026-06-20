import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type {
  SecretsManagerGetSecretValueParams,
  SecretsManagerResponse,
} from '@/tools/secrets_manager/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: SecretsManagerGetSecretValueParams) => ({
  SecretId: p.secretId,
})

export const getSecretValueTool: ToolConfig<
  SecretsManagerGetSecretValueParams,
  SecretsManagerResponse
> = {
  id: 'secrets_manager_get_secret_value',
  name: 'Secrets Manager Get Secret Value',
  description: 'Retrieve the value of a secret from AWS Secrets Manager',
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
    secretId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The ARN or name of the secret to retrieve',
    },
  },

  request: {
    url: (p) => `https://secretsmanager.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'secretsmanager',
        target: 'secretsmanager.GetSecretValue',
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
    data: { type: 'json', description: 'Secrets Manager GetSecretValue result (SecretString, …)' },
  },
}
