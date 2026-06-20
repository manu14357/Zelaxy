import { awsQueryHeaders } from '@/lib/aws/sigv4'
import type { IamListRolesParams, IamResponse } from '@/tools/iam/types'
import type { ToolConfig } from '@/tools/types'

const buildForm = (_p: IamListRolesParams) => {
  const form = new URLSearchParams()
  form.set('Action', 'ListRoles')
  form.set('Version', '2010-05-08')
  return form.toString()
}

export const listRolesTool: ToolConfig<IamListRolesParams, IamResponse> = {
  id: 'iam_list_roles',
  name: 'IAM List Roles',
  description: 'List AWS IAM roles in the account',
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
    const roleNames = [...text.matchAll(/<RoleName>([^<]*)<\/RoleName>/g)].map((m) => m[1])
    const arns = [...text.matchAll(/<Arn>([^<]*)<\/Arn>/g)].map((m) => m[1])
    const roles = roleNames.map((roleName, i) => ({ roleName, arn: arns[i] }))
    return { success: true, output: { data: { roles } } }
  },

  outputs: {
    data: { type: 'json', description: 'IAM ListRoles result (roles: roleName, arn)' },
  },
}
