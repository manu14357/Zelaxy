import { createContactTool } from '@/tools/hubspot/create_contact'
import { createDealTool } from '@/tools/hubspot/create_deal'
import { getContactTool } from '@/tools/hubspot/get_contact'
import { listContactsTool } from '@/tools/hubspot/list_contacts'
import { searchContactsTool } from '@/tools/hubspot/search_contacts'

export const hubspotCreateContactTool = createContactTool
export const hubspotGetContactTool = getContactTool
export const hubspotListContactsTool = listContactsTool
export const hubspotSearchContactsTool = searchContactsTool
export const hubspotCreateDealTool = createDealTool
