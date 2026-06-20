import { getUserTool } from '@/tools/iam/get_user'
import { listRolesTool } from '@/tools/iam/list_roles'
import { listUsersTool } from '@/tools/iam/list_users'

export const iamListUsersTool = listUsersTool
export const iamListRolesTool = listRolesTool
export const iamGetUserTool = getUserTool
