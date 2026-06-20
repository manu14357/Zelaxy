import { createDeploymentTool } from '@/tools/vercel/create_deployment'
import { getDeploymentTool } from '@/tools/vercel/get_deployment'
import { listDeploymentsTool } from '@/tools/vercel/list_deployments'
import { listProjectsTool } from '@/tools/vercel/list_projects'

export const vercelListProjectsTool = listProjectsTool
export const vercelListDeploymentsTool = listDeploymentsTool
export const vercelGetDeploymentTool = getDeploymentTool
export const vercelCreateDeploymentTool = createDeploymentTool
