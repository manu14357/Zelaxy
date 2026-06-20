import { createUserTool } from '@/tools/microsoft_ad/create_user'
import { getUserTool } from '@/tools/microsoft_ad/get_user'
import { listGroupsTool } from '@/tools/microsoft_ad/list_groups'
import { listUsersTool } from '@/tools/microsoft_ad/list_users'

export const microsoftAdListUsersTool = listUsersTool
export const microsoftAdGetUserTool = getUserTool
export const microsoftAdListGroupsTool = listGroupsTool
export const microsoftAdCreateUserTool = createUserTool
