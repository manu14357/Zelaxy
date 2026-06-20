import { getIssueTool } from '@/tools/sentry/get_issue'
import { listIssuesTool } from '@/tools/sentry/list_issues'
import { listProjectsTool } from '@/tools/sentry/list_projects'
import { updateIssueTool } from '@/tools/sentry/update_issue'

export const sentryListProjectsTool = listProjectsTool
export const sentryListIssuesTool = listIssuesTool
export const sentryGetIssueTool = getIssueTool
export const sentryUpdateIssueTool = updateIssueTool
