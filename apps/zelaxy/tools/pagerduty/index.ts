import { createIncidentTool } from '@/tools/pagerduty/create_incident'
import { getIncidentTool } from '@/tools/pagerduty/get_incident'
import { listIncidentsTool } from '@/tools/pagerduty/list_incidents'
import { listServicesTool } from '@/tools/pagerduty/list_services'

export const pagerdutyListIncidentsTool = listIncidentsTool
export const pagerdutyCreateIncidentTool = createIncidentTool
export const pagerdutyGetIncidentTool = getIncidentTool
export const pagerdutyListServicesTool = listServicesTool
