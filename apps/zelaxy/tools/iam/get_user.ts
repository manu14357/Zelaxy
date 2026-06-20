import { awsQueryHeaders } from '@/lib/aws/sigv4'
import type { IamGetUserParams, IamResponse } from '@/tools/iam/types'
import type { ToolConfig } from '@/tools/types'

const buildForm = (p: IamGetUserParams) => {
  const form = new URLSearchParams()
  form.set('Action', 'GetUser')
  form.set('UserName', p.userName)
  form.set('Version', '2010-05-08')
  return form.toString()
}

export const getUserTool: ToolConfig<IamGetUserParams, IamResponse> = {
  id: 'iam_get_user',
  name: 'IAM Get User',
  description: 'Get details for an AWS IAM user by name',
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
    userName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The IAM user name to look up',
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
    const userName = text.match(/<UserName>([^<]*)<\/UserName>/)?.[1]
    const arn = text.match(/<Arn>([^<]*)<\/Arn>/)?.[1]
    const userId = text.match(/<UserId>([^<]*)<\/UserId>/)?.[1]
    return { success: true, output: { data: { userName, arn, userId } } }
  },

  outputs: {
    data: { type: 'json', description: 'IAM GetUser result (userName, arn, userId)' },
  },
}
