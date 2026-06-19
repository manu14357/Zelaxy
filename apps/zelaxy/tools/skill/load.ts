import { createLogger } from '@/lib/logs/console/logger'
import type { ToolConfig } from '@/tools/types'

const logger = createLogger('LoadSkillTool')

interface LoadSkillParams {
  skill_name: string
  workspaceId?: string
}

interface LoadSkillOutput {
  success: boolean
  output: { name: string; description: string; content: string }
}

/**
 * The load_skill tool — progressive disclosure for Agent Skills. The agent calls it with a skill
 * name (which it saw in the injected <available_skills> list); the tool returns the full skill
 * content for the agent to follow. Added to the agent's tool list automatically when skills are
 * attached (see the agent handler).
 */
export const loadSkillTool: ToolConfig<LoadSkillParams, LoadSkillOutput> = {
  id: 'load_skill',
  name: 'load_skill',
  description:
    'Load the full instructions for one of the available skills by its name. Call this when a skill is relevant to the current task.',
  version: '1.0.0',

  params: {
    skill_name: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'The name of the skill to load (from the available skills list)',
    },
    workspaceId: {
      type: 'string',
      required: false,
      visibility: 'hidden',
      description: 'Workspace context (injected automatically)',
    },
  },

  request: {
    url: '/api/skills/load',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params) => ({ workspaceId: params.workspaceId, name: params.skill_name }),
  },

  transformResponse: async (response: Response): Promise<LoadSkillOutput> => {
    const result = await response.json()
    if (!result.success) {
      logger.warn('load_skill failed', { error: result.error })
      throw new Error(result.error || 'Failed to load skill')
    }
    return { success: true, output: result.output }
  },

  outputs: {
    name: { type: 'string', description: 'Skill name' },
    description: { type: 'string', description: 'Skill description' },
    content: { type: 'string', description: 'Full skill instructions' },
  },
}
