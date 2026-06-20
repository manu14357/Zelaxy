import { createTicketTool } from '@/tools/zendesk/create_ticket'
import { getTicketTool } from '@/tools/zendesk/get_ticket'
import { listTicketsTool } from '@/tools/zendesk/list_tickets'
import { searchTool } from '@/tools/zendesk/search'
import { updateTicketTool } from '@/tools/zendesk/update_ticket'

export const zendeskCreateTicketTool = createTicketTool
export const zendeskListTicketsTool = listTicketsTool
export const zendeskGetTicketTool = getTicketTool
export const zendeskUpdateTicketTool = updateTicketTool
export const zendeskSearchTool = searchTool
