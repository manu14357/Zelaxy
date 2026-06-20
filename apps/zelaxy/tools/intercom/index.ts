import { createContactTool } from '@/tools/intercom/create_contact'
import { getContactTool } from '@/tools/intercom/get_contact'
import { listContactsTool } from '@/tools/intercom/list_contacts'
import { searchContactsTool } from '@/tools/intercom/search_contacts'

export const intercomCreateContactTool = createContactTool
export const intercomListContactsTool = listContactsTool
export const intercomGetContactTool = getContactTool
export const intercomSearchContactsTool = searchContactsTool
