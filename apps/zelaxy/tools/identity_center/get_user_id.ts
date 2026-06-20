import { awsJsonHeaders } from '@/lib/aws/sigv4'
import type {
  IdentityCenterGetUserIdParams,
  IdentityCenterResponse,
} from '@/tools/identity_center/types'
import type { ToolConfig } from '@/tools/types'

const buildPayload = (p: IdentityCenterGetUserIdParams) => ({
  IdentityStoreId: p.identityStoreId,
  AlternateIdentifier: {
    UniqueAttribute: {
      AttributePath: 'userName',
      AttributeValue: p.userName,
    },
  },
})

export const getUserIdTool: ToolConfig<IdentityCenterGetUserIdParams, IdentityCenterResponse> = {
  id: 'identity_center_get_user_id',
  name: 'Identity Center Get User ID',
  description: 'Resolve a user ID by user name in an AWS IAM Identity Center identity store',
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
    userName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The user name to resolve',
    },
  },

  request: {
    url: (p) => `https://identitystore.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsJsonHeaders({
        region: p.awsRegion,
        service: 'identitystore',
        target: 'AWSIdentityStore.GetUserId',
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
    data: {
      type: 'json',
      description: 'Identity Store GetUserId result (UserId, IdentityStoreId)',
    },
  },
}
