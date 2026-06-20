import { createUserTool } from '@/tools/okta/create_user'
import { getUserTool } from '@/tools/okta/get_user'
import { listGroupsTool } from '@/tools/okta/list_groups'
import { listUsersTool } from '@/tools/okta/list_users'

export const oktaListUsersTool = listUsersTool
export const oktaGetUserTool = getUserTool
export const oktaCreateUserTool = createUserTool
export const oktaListGroupsTool = listGroupsTool
