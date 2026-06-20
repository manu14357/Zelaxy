import { createSecretTool } from '@/tools/infisical/create_secret'
import { getSecretTool } from '@/tools/infisical/get_secret'
import { listSecretsTool } from '@/tools/infisical/list_secrets'

export const infisicalListSecretsTool = listSecretsTool
export const infisicalGetSecretTool = getSecretTool
export const infisicalCreateSecretTool = createSecretTool
