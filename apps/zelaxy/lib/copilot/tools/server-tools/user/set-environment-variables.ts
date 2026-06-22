import { setEnvironmentVariablesForUser } from '@/lib/environment/utils'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserId } from '@/app/api/auth/oauth/utils'
import { BaseCopilotTool } from '../base'

interface SetEnvironmentVariablesParams {
  variables: Record<string, any>
  workflowId?: string
  userId?: string
}

interface SetEnvironmentVariablesResult {
  message: string
  updatedVariables: string[]
  count: number
}

class SetEnvironmentVariablesTool extends BaseCopilotTool<
  SetEnvironmentVariablesParams,
  SetEnvironmentVariablesResult
> {
  readonly id = 'set_environment_variables'
  readonly displayName = 'Setting environment variables'
  readonly requiresInterrupt = true

  protected async executeImpl(
    params: SetEnvironmentVariablesParams
  ): Promise<SetEnvironmentVariablesResult> {
    return setEnvironmentVariables(params)
  }
}

// Export the tool instance
export const setEnvironmentVariablesTool = new SetEnvironmentVariablesTool()

// Implementation function
async function setEnvironmentVariables(
  params: SetEnvironmentVariablesParams
): Promise<SetEnvironmentVariablesResult> {
  const logger = createLogger('SetEnvironmentVariables')
  const { variables, workflowId, userId: directUserId } = params

  logger.info('Setting environment variables for copilot', {
    variableCount: Object.keys(variables).length,
    variableNames: Object.keys(variables),
    hasWorkflowId: !!workflowId,
  })

  // Resolve the owner in-process (no self-HTTP round-trip / localhost fallback) — mirrors how
  // get_environment_variables works, and works regardless of NEXT_PUBLIC_APP_URL.
  const userId =
    directUserId || (workflowId ? await getUserId('copilot-set-env-vars', workflowId) : undefined)
  if (!userId) {
    throw new Error('Either userId or workflowId is required to set environment variables')
  }

  // Coerce values to strings (the schema accepts any) and persist in-process.
  const stringVars: Record<string, string> = {}
  for (const [k, v] of Object.entries(variables)) stringVars[k] = String(v)

  const result = await setEnvironmentVariablesForUser(userId, stringVars)

  return {
    message: `Environment variables updated (${result.addedVariables.length} added, ${result.updatedVariables.length} changed)`,
    updatedVariables: result.variableNames,
    count: result.variableNames.length,
  }
}
