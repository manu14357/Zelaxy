import { awsQueryHeaders } from '@/lib/aws/sigv4'
import type { StsGetSessionTokenParams, StsResponse } from '@/tools/sts/types'
import type { ToolConfig } from '@/tools/types'

const buildForm = (p: StsGetSessionTokenParams): string => {
  const form = new URLSearchParams()
  form.append('Action', 'GetSessionToken')
  form.append('Version', '2011-06-15')
  form.append('DurationSeconds', String(p.durationSeconds ?? 3600))
  return form.toString()
}

const match = (text: string, tag: string): string | undefined => {
  const m = text.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return m ? m[1] : undefined
}

export const getSessionTokenTool: ToolConfig<StsGetSessionTokenParams, StsResponse> = {
  id: 'sts_get_session_token',
  name: 'STS Get Session Token',
  description: 'Return a set of temporary credentials for an AWS account or IAM user',
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
    durationSeconds: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration of the temporary credentials in seconds (default 3600)',
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
      AccessKeyId: match(text, 'AccessKeyId'),
      SecretAccessKey: match(text, 'SecretAccessKey'),
      SessionToken: match(text, 'SessionToken'),
      Expiration: match(text, 'Expiration'),
    }
    return { success: true, output: { data } }
  },

  outputs: {
    data: {
      type: 'json',
      description: 'STS GetSessionToken result (AccessKeyId, SecretAccessKey, SessionToken, …)',
    },
  },
}
