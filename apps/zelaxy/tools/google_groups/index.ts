import { addMemberTool } from '@/tools/google_groups/add_member'
import { getGroupTool } from '@/tools/google_groups/get_group'
import { listGroupsTool } from '@/tools/google_groups/list_groups'
import { listMembersTool } from '@/tools/google_groups/list_members'

export const googleGroupsListGroupsTool = listGroupsTool
export const googleGroupsGetGroupTool = getGroupTool
export const googleGroupsListMembersTool = listMembersTool
export const googleGroupsAddMemberTool = addMemberTool
