import { awsQueryHeaders } from '@/lib/aws/sigv4'
import type { IamListUsersParams, IamResponse } from '@/tools/iam/types'
import type { ToolConfig } from '@/tools/types'

const buildForm = (_p: IamListUsersParams) => {
  const form = new URLSearchParams()
  form.set('Action', 'ListUsers')
  form.set('Version', '2010-05-08')
  return form.toString()
}

export const listUsersTool: ToolConfig<IamListUsersParams, IamResponse> = {
  id: 'iam_list_users',
  name: 'IAM List Users',
  description: 'List AWS IAM users in the account',
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
    url: () => 'https://iam.amazonaws.com/',
    method: 'POST',
    headers: (p) =>
      awsQueryHeaders({
        region: 'us-east-1',
        service: 'iam',
        host: 'iam.amazonaws.com',
        accessKeyId: p.awsAccessKeyId,
        secretAccessKey: p.awsSecretAccessKey,
        body: buildForm(p),
      }),
    body: (p) => ({ body: buildForm(p) }),
  },

  transformResponse: async (response) => {
    const text = await response.text()
    const userNames = [...text.matchAll(/<UserName>([^<]*)<\/UserName>/g)].map((m) => m[1])
    const arns = [...text.matchAll(/<Arn>([^<]*)<\/Arn>/g)].map((m) => m[1])
    const users = userNames.map((userName, i) => ({ userName, arn: arns[i] }))
    return { success: true, output: { data: { users } } }
  },

  outputs: {
    data: { type: 'json', description: 'IAM ListUsers result (users: userName, arn)' },
  },
}
