import { createDealTool } from '@/tools/pipedrive/create_deal'
import { createPersonTool } from '@/tools/pipedrive/create_person'
import { listDealsTool } from '@/tools/pipedrive/list_deals'
import { searchDealsTool } from '@/tools/pipedrive/search_deals'

export const pipedriveCreateDealTool = createDealTool
export const pipedriveListDealsTool = listDealsTool
export const pipedriveCreatePersonTool = createPersonTool
export const pipedriveSearchDealsTool = searchDealsTool
