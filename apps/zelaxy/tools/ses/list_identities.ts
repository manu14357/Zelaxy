import { signAwsV4 } from '@/lib/aws/sigv4'
import type { SesListIdentitiesParams, SesResponse } from '@/tools/ses/types'
import type { ToolConfig } from '@/tools/types'

export const listIdentitiesTool: ToolConfig<SesListIdentitiesParams, SesResponse> = {
  id: 'ses_list_identities',
  name: 'SES List Identities',
  description: 'List email identities configured in Amazon SES v2',
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
    url: (p) => `https://email.${p.awsRegion}.amazonaws.com/v2/email/identities`,
    method: 'GET',
    headers: (p) =>
      signAwsV4({
        method: 'GET',
        url: `https://email.${p.awsRegion}.amazonaws.com/v2/email/identities`,
        region: p.awsRegion,
        service: 'ses',
        accessKeyId: p.awsAccessKeyId,
        secretAccessKey: p.awsSecretAccessKey,
        headers: { 'Content-Type': 'application/json' },
        body: '',
      }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return { success: true, output: { data } }
  },

  outputs: {
    data: { type: 'json', description: 'SES ListEmailIdentities result' },
  },
}
