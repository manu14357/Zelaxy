import { awsQueryHeaders } from '@/lib/aws/sigv4'
import type { StsGetCallerIdentityParams, StsResponse } from '@/tools/sts/types'
import type { ToolConfig } from '@/tools/types'

const buildForm = (_p: StsGetCallerIdentityParams): string => {
  const form = new URLSearchParams()
  form.append('Action', 'GetCallerIdentity')
  form.append('Version', '2011-06-15')
  return form.toString()
}

const match = (text: string, tag: string): string | undefined => {
  const m = text.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return m ? m[1] : undefined
}

export const getCallerIdentityTool: ToolConfig<StsGetCallerIdentityParams, StsResponse> = {
  id: 'sts_get_caller_identity',
  name: 'STS Get Caller Identity',
  description: 'Return details about the IAM identity whose credentials are used to call the API',
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
    url: (p) => `https://sts.${p.awsRegion}.amazonaws.com/`,
    method: 'POST',
    headers: (p) =>
      awsQueryHeaders({
        region: p.awsRegion,
        service: 'sts',
        accessKeyId: p.awsAccessKeyId,
        secretAccessKey: p.awsSecretAccessKey,
        body: buildForm(p),
      }),
    body: (p) => ({ body: buildForm(p) }),
  },

  transformResponse: async (response) => {
    const text = await response.text()
    const data = {
      Arn: match(text, 'Arn'),
      UserId: match(text, 'UserId'),
      Account: match(text, 'Account'),
    }
    return { success: true, output: { data } }
  },

  outputs: {
    data: { type: 'json', description: 'STS GetCallerIdentity result (Arn, UserId, Account)' },
  },
}
