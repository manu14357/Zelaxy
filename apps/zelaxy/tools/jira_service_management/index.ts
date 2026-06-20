import { createRequestTool } from '@/tools/jira_service_management/create_request'
import { getRequestTool } from '@/tools/jira_service_management/get_request'
import { listRequestsTool } from '@/tools/jira_service_management/list_requests'
import { listServiceDesksTool } from '@/tools/jira_service_management/list_servicedesks'

export const jiraServiceManagementListServicedesksTool = listServiceDesksTool
export const jiraServiceManagementCreateRequestTool = createRequestTool
export const jiraServiceManagementGetRequestTool = getRequestTool
export const jiraServiceManagementListRequestsTool = listRequestsTool
