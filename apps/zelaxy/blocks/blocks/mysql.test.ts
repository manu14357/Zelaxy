/**
 * Tests for MySQL block definition
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { MySQLBlock } from '@/blocks/blocks/mysql'

describe('MySQL Block Config', () => {
  it('should have correct block type', () => {
    expect(MySQLBlock.type).toBe('mysql')
  })

  it('should be in tools category', () => {
    expect(MySQLBlock.category).toBe('tools')
  })

  it('should reference the mysql_database tool', () => {
    expect(MySQLBlock.tools.access).toContain('mysql_database')
  })

  it('should have connection sub-blocks', () => {
    const ids = MySQLBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('host')
    expect(ids).toContain('port')
    expect(ids).toContain('database')
    expect(ids).toContain('username')
    expect(ids).toContain('password')
    expect(ids).toContain('ssl')
  })

  it('should have host as required short-input', () => {
    const hostBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'host')
    expect(hostBlock).toBeDefined()
    expect(hostBlock!.type).toBe('short-input')
    expect(hostBlock!.required).toBe(true)
    expect(hostBlock!.layout).toBe('half')
  })

  it('should default port to 3306', () => {
    const portBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'port')
    expect(portBlock).toBeDefined()
    expect(portBlock!.value!({})).toBe('3306')
  })

  it('should have password field with password flag', () => {
    const passwordBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'password')
    expect(passwordBlock).toBeDefined()
    expect(passwordBlock!.password).toBe(true)
    expect(passwordBlock!.required).toBeUndefined()
  })

  it('should have action dropdown with database operations', () => {
    const actionBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'action')
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
    const actionBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'action')
    expect(actionBlock!.value!({})).toBe('execute')
  })

  it('should have query sub-block with wand config', () => {
    const queryBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'query')
    expect(queryBlock).toBeDefined()
    expect(queryBlock!.type).toBe('code')
    expect(queryBlock!.wandConfig).toBeDefined()
    expect(queryBlock!.wandConfig!.enabled).toBe(true)
  })

  it('should show query only for execute action', () => {
    const queryBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'query')
    expect(queryBlock!.condition).toEqual({ field: 'action', value: 'execute' })
  })

  it('should show table for insert/update/delete actions', () => {
    const tableBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'table')
    expect(tableBlock).toBeDefined()
    expect(tableBlock!.condition).toEqual({
      field: 'action',
      value: ['insert', 'update', 'delete'],
    })
  })

  it('should show data for insert/update actions', () => {
    const dataBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'data')
    expect(dataBlock).toBeDefined()
    expect(dataBlock!.condition).toEqual({
      field: 'action',
      value: ['insert', 'update'],
    })
  })

  it('should show conditions for update/delete actions', () => {
    const conditionsBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'conditions')
    expect(conditionsBlock).toBeDefined()
    expect(conditionsBlock!.condition).toEqual({
      field: 'action',
      value: ['update', 'delete'],
    })
  })

  it('should have ssl switch sub-block', () => {
    const sslBlock = MySQLBlock.subBlocks.find((sb) => sb.id === 'ssl')
    expect(sslBlock).toBeDefined()
    expect(sslBlock!.type).toBe('switch')
  })

  it('should define expected inputs', () => {
    expect(MySQLBlock.inputs.host).toBeDefined()
    expect(MySQLBlock.inputs.port).toBeDefined()
    expect(MySQLBlock.inputs.database).toBeDefined()
    expect(MySQLBlock.inputs.username).toBeDefined()
    expect(MySQLBlock.inputs.password).toBeDefined()
    expect(MySQLBlock.inputs.ssl).toBeDefined()
    expect(MySQLBlock.inputs.action).toBeDefined()
    expect(MySQLBlock.inputs.query).toBeDefined()
    expect(MySQLBlock.inputs.table).toBeDefined()
    expect(MySQLBlock.inputs.data).toBeDefined()
    expect(MySQLBlock.inputs.conditions).toBeDefined()
  })

  it('should define expected outputs', () => {
    expect(MySQLBlock.outputs.data).toBeDefined()
    expect(MySQLBlock.outputs.affectedRows).toBeDefined()
    expect(MySQLBlock.outputs.metadata).toBeDefined()
    expect(MySQLBlock.outputs.error).toBeDefined()
    expect(MySQLBlock.outputs.errorDetails).toBeDefined()
  })

  it('should have MySQL brand color', () => {
    expect(MySQLBlock.bgColor).toBe('#FFFFFF')
  })

  it('should have an icon', () => {
    expect(MySQLBlock.icon).toBeDefined()
  })
})
