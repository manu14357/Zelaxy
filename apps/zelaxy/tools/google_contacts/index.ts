import { createContactTool } from '@/tools/google_contacts/create_contact'
import { getContactTool } from '@/tools/google_contacts/get_contact'
import { listContactsTool } from '@/tools/google_contacts/list_contacts'
import { searchContactsTool } from '@/tools/google_contacts/search_contacts'

export const googleContactsListContactsTool = listContactsTool
export const googleContactsGetContactTool = getContactTool
export const googleContactsSearchContactsTool = searchContactsTool
export const googleContactsCreateContactTool = createContactTool
