/**
 * Tests for PostgreSQL block definition
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { PostgreSQLBlock } from '@/blocks/blocks/postgresql'

describe('PostgreSQL Block Config', () => {
  it('should have correct block type', () => {
    expect(PostgreSQLBlock.type).toBe('postgresql')
  })

  it('should be in tools category', () => {
    expect(PostgreSQLBlock.category).toBe('tools')
  })

  it('should reference the postgresql_database tool', () => {
    expect(PostgreSQLBlock.tools.access).toContain('postgresql_database')
  })

  it('should have connection sub-blocks', () => {
    const ids = PostgreSQLBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('host')
    expect(ids).toContain('port')
    expect(ids).toContain('database')
    expect(ids).toContain('username')
    expect(ids).toContain('password')
    expect(ids).toContain('ssl')
  })

  it('should have host as required short-input', () => {
    const hostBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'host')
    expect(hostBlock).toBeDefined()
    expect(hostBlock!.type).toBe('short-input')
    expect(hostBlock!.required).toBe(true)
    expect(hostBlock!.layout).toBe('half')
  })

  it('should default port to 5432', () => {
    const portBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'port')
    expect(portBlock).toBeDefined()
    expect(portBlock!.value!({})).toBe('5432')
  })

  it('should have password field with password flag', () => {
    const passwordBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'password')
    expect(passwordBlock).toBeDefined()
    expect(passwordBlock!.password).toBe(true)
    expect(passwordBlock!.required).toBeUndefined()
  })

  it('should have action dropdown with database operations', () => {
    const actionBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'action')
    expect(actionBlock).toBeDefined()
    expect(actionBlock!.type).toBe('dropdown')

    const options = actionBlock!.options as { label: string; id: string }[]
    const optionIds = options.map((o) => o.id)
    expect(optionIds).toContain('execute')
    expect(optionIds).toContain('insert')
    expect(optionIds).toContain('update')
    expect(optionIds).toContain('delete')
  })

  it('should default action to execute', () => {
    const actionBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'action')
    expect(actionBlock!.value!({})).toBe('execute')
  })

  it('should have query sub-block with wand config', () => {
    const queryBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'query')
    expect(queryBlock).toBeDefined()
    expect(queryBlock!.type).toBe('code')
    expect(queryBlock!.wandConfig).toBeDefined()
    expect(queryBlock!.wandConfig!.enabled).toBe(true)
  })

  it('should show query only for execute action', () => {
    const queryBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'query')
    expect(queryBlock!.condition).toEqual({ field: 'action', value: 'execute' })
  })

  it('should show table for insert/update/delete actions', () => {
    const tableBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'table')
    expect(tableBlock).toBeDefined()
    expect(tableBlock!.condition).toEqual({
      field: 'action',
      value: ['insert', 'update', 'delete'],
    })
  })

  it('should show data for insert/update actions', () => {
    const dataBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'data')
    expect(dataBlock).toBeDefined()
    expect(dataBlock!.condition).toEqual({
      field: 'action',
      value: ['insert', 'update'],
    })
  })

  it('should show conditions for update/delete actions', () => {
    const conditionsBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'conditions')
    expect(conditionsBlock).toBeDefined()
    expect(conditionsBlock!.condition).toEqual({
      field: 'action',
      value: ['update', 'delete'],
    })
  })

  it('should have ssl switch sub-block', () => {
    const sslBlock = PostgreSQLBlock.subBlocks.find((sb) => sb.id === 'ssl')
    expect(sslBlock).toBeDefined()
    expect(sslBlock!.type).toBe('switch')
  })

  it('should define expected inputs', () => {
    expect(PostgreSQLBlock.inputs.host).toBeDefined()
    expect(PostgreSQLBlock.inputs.port).toBeDefined()
    expect(PostgreSQLBlock.inputs.database).toBeDefined()
    expect(PostgreSQLBlock.inputs.username).toBeDefined()
    expect(PostgreSQLBlock.inputs.password).toBeDefined()
    expect(PostgreSQLBlock.inputs.ssl).toBeDefined()
    expect(PostgreSQLBlock.inputs.action).toBeDefined()
    expect(PostgreSQLBlock.inputs.query).toBeDefined()
    expect(PostgreSQLBlock.inputs.table).toBeDefined()
    expect(PostgreSQLBlock.inputs.data).toBeDefined()
    expect(PostgreSQLBlock.inputs.conditions).toBeDefined()
  })

  it('should define expected outputs', () => {
    expect(PostgreSQLBlock.outputs.data).toBeDefined()
    expect(PostgreSQLBlock.outputs.affectedRows).toBeDefined()
    expect(PostgreSQLBlock.outputs.metadata).toBeDefined()
    expect(PostgreSQLBlock.outputs.error).toBeDefined()
    expect(PostgreSQLBlock.outputs.errorDetails).toBeDefined()
  })

  it('should have PostgreSQL brand color', () => {
    expect(PostgreSQLBlock.bgColor).toBe('#336791')
  })

  it('should have an icon', () => {
    expect(PostgreSQLBlock.icon).toBeDefined()
  })
})
