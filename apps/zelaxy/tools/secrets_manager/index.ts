import { createSecretTool } from '@/tools/secrets_manager/create_secret'
import { getSecretValueTool } from '@/tools/secrets_manager/get_secret_value'
import { listSecretsTool } from '@/tools/secrets_manager/list_secrets'

export const secretsManagerGetSecretValueTool = getSecretValueTool
export const secretsManagerListSecretsTool = listSecretsTool
export const secretsManagerCreateSecretTool = createSecretTool
