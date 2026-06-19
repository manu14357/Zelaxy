import { describe, expect, it } from 'vitest'
import { AgentBlock } from '@/blocks/blocks/agent'
import { loadSkillTool } from '@/tools/skill/load'

describe('load_skill tool', () => {
  it('has the expected id and internal endpoint', () => {
    expect(loadSkillTool.id).toBe('load_skill')
    expect(loadSkillTool.request?.url).toBe('/api/skills/load')
    expect(loadSkillTool.request?.method).toBe('POST')
  })

  it('builds a body mapping skill_name -> name with workspaceId', () => {
    const body = loadSkillTool.request?.body?.({
      skill_name: 'sql-expert',
      workspaceId: 'ws_1',
    } as any)
    expect(body).toEqual({ workspaceId: 'ws_1', name: 'sql-expert' })
  })
})

describe('Agent block skills wiring', () => {
  it('exposes a skill-selector sub-block', () => {
    const skillsSub = AgentBlock.subBlocks.find((s) => s.id === 'skills')
    expect(skillsSub).toBeDefined()
    expect(skillsSub?.type).toBe('skill-selector')
  })

  it('passes attached skills through the params transformer', () => {
    const out = AgentBlock.tools.config?.params?.({
      model: 'gpt-4o',
      skills: [
        { id: '1', name: 'sql-expert', description: 'SQL', extra: 'drop me' },
        { id: '2', name: '', description: 'no name' }, // filtered out
      ],
    } as any)
    expect(out?.skills).toEqual([{ id: '1', name: 'sql-expert', description: 'SQL' }])
  })
})
