import { describe, expect, it } from 'vitest'
import { JiraServiceManagementBlock } from '@/blocks/blocks/jira_service_management'
import { tools as toolRegistry } from '@/tools/registry'

/**
 * The block/tool contract fails silently: an access id with no registry entry compiles and only
 * breaks at runtime when the operation cannot resolve. These assertions are the guard.
 */
describe('Jira Service Management block/tool contract', () => {
  const access = JiraServiceManagementBlock.tools.access as string[]

  it('exposes the full JSM surface', () => {
    expect(access.length).toBe(43)
  })

  it('every tools.access id resolves to a registered tool', () => {
    expect(access.filter((id) => !(id in toolRegistry))).toEqual([])
  })

  it('every registered tool reports the id it is keyed under', () => {
    expect(access.filter((id) => (toolRegistry as any)[id]?.id !== id)).toEqual([])
  })

  it('every dropdown option maps to a tool in access', () => {
    const options = (JiraServiceManagementBlock.subBlocks.find((s) => s.id === 'operation') as any)
      .options as Array<{ id: string }>
    expect(options.length).toBe(43)
    expect(options.map((o) => o.id).filter((id) => !access.includes(id))).toEqual([])
  })

  it('config.tool falls back to a registered tool', () => {
    const resolved = JiraServiceManagementBlock.tools.config?.tool?.({} as any)
    expect(toolRegistry).toHaveProperty(resolved as string)
  })

  it('keeps the four pre-existing tool ids, which are persisted in saved workflows', () => {
    for (const id of [
      'jira_service_management_list_servicedesks',
      'jira_service_management_create_request',
      'jira_service_management_get_request',
      'jira_service_management_list_requests',
    ]) {
      expect(toolRegistry).toHaveProperty(id)
    }
  })
})

describe('Jira Service Management auth model', () => {
  const access = JiraServiceManagementBlock.tools.access as string[]

  it('every tool authenticates with jira OAuth — no tool is left on Basic auth', () => {
    expect(access.filter((id) => (toolRegistry as any)[id]?.oauth?.provider !== 'jira')).toEqual([])
  })

  it('no tool still expects the old Basic auth params', () => {
    const basic = access.filter((id) => {
      const p = (toolRegistry as any)[id]?.params || {}
      return 'siteUrl' in p || 'email' in p || 'apiToken' in p
    })
    expect(basic).toEqual([])
  })

  it('the block collects an OAuth credential rather than Basic auth fields', () => {
    const ids = JiraServiceManagementBlock.subBlocks.map((s) => s.id)
    expect(ids).toContain('credential')
    expect(ids).not.toContain('siteUrl')
    expect(ids).not.toContain('apiToken')
  })

  it('every tool is callable: it declares either a request url or directExecution', () => {
    const broken = access.filter((id) => {
      const t = (toolRegistry as any)[id]
      return !t?.request?.url && typeof t?.directExecution !== 'function'
    })
    expect(broken).toEqual([])
  })

  it('every tool declares outputs so downstream blocks can reference them', () => {
    const none = access.filter((id) => {
      const o = (toolRegistry as any)[id]?.outputs
      return !o || Object.keys(o).length === 0
    })
    expect(none).toEqual([])
  })
})
