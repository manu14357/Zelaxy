import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type {
  IdentityCenterListUsersParams,
  IdentityCenterResponse,
} from '@/tools/identity_center/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: IdentityCenterListUsersParams) => ({
  IdentityStoreId: p.identityStoreId,
})

export const listUsersTool: ToolConfig<IdentityCenterListUsersParams, IdentityCenterResponse> = {
  id: 'identity_center_list_users',
  name: 'Identity Center List Users',
  description: 'List users in an AWS IAM Identity Center identity store',
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
    identityStoreId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The identity store ID (e.g. d-1234567890)',
    },
  },

  request: {
    url: (p) => `https://identitystore.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'identitystore',
        target: 'AWSIdentityStore.ListUsers',
        accessKeyId: p.awsAccessKeyId,
        secretAccessKey: p.awsSecretAccessKey,
        body: JSON.stringify(buildPayload(p)),
        jsonVersion: '1.1',
        host: `identitystore.${p.awsRegion}.amazonaws.com`,
      }),
    body: (p) => buildPayload(p),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: { data } }
  },

  outputs: {
    data: { type: 'json', description: 'Identity Store ListUsers result (Users, NextToken)' },
  },
}
