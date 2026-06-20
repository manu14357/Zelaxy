import { completeTaskTool } from '@/tools/google_tasks/complete_task'
import { createTaskTool } from '@/tools/google_tasks/create_task'
import { listTaskListsTool } from '@/tools/google_tasks/list_tasklists'
import { listTasksTool } from '@/tools/google_tasks/list_tasks'

export const googleTasksListTasklistsTool = listTaskListsTool
export const googleTasksListTasksTool = listTasksTool
export const googleTasksCreateTaskTool = createTaskTool
export const googleTasksCompleteTaskTool = completeTaskTool
