import { getDashboardTool } from '@/tools/grafana/get_dashboard'
import { listAlertsTool } from '@/tools/grafana/list_alerts'
import { listDatasourcesTool } from '@/tools/grafana/list_datasources'
import { searchDashboardsTool } from '@/tools/grafana/search_dashboards'

export const grafanaSearchDashboardsTool = searchDashboardsTool
export const grafanaGetDashboardTool = getDashboardTool
export const grafanaListDatasourcesTool = listDatasourcesTool
export const grafanaListAlertsTool = listAlertsTool
