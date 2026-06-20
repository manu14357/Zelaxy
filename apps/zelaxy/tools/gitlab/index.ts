import { createIssueTool } from '@/tools/gitlab/create_issue'
import { getFileTool } from '@/tools/gitlab/get_file'
import { getProjectTool } from '@/tools/gitlab/get_project'
import { listIssuesTool } from '@/tools/gitlab/list_issues'
import { listProjectsTool } from '@/tools/gitlab/list_projects'

export const gitlabListProjectsTool = listProjectsTool
export const gitlabGetProjectTool = getProjectTool
export const gitlabListIssuesTool = listIssuesTool
export const gitlabCreateIssueTool = createIssueTool
export const gitlabGetFileTool = getFileTool
