/**
 * Tests for Wait / Delay tool config
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { delayTool } from '@/tools/delay'

describe('Delay Tool Config', () => {
  it('should have the correct tool ID', () => {
    expect(delayTool.id).toBe('delay_wait')
  })

  it('should have required params', () => {
    expect(delayTool.params.duration).toBeDefined()
    expect(delayTool.params.duration.required).toBe(true)
    expect(delayTool.params.duration.type).toBe('number')

    expect(delayTool.params.unit).toBeDefined()
    expect(delayTool.params.unit.required).toBe(true)
    expect(delayTool.params.unit.type).toBe('string')
  })

  it('should point to the correct internal API route', () => {
    expect(delayTool.request.url).toBe('/api/tools/delay')
    expect(delayTool.request.method).toBe('POST')
  })

  it('should build request body correctly', () => {
    const params = { duration: 10, unit: 'seconds' as const }
    const body = delayTool.request.body!(params)

    expect(body).toEqual({ duration: 10, unit: 'seconds' })
  })

  it('should define expected outputs', () => {
    expect(delayTool.outputs).toBeDefined()
    expect(delayTool.outputs!.delayed).toBeDefined()
    expect(delayTool.outputs!.duration).toBeDefined()
    expect(delayTool.outputs!.unit).toBeDefined()
    expect(delayTool.outputs!.delayMs).toBeDefined()
    expect(delayTool.outputs!.startedAt).toBeDefined()
    expect(delayTool.outputs!.completedAt).toBeDefined()
  })

  it('should set all params as user-only visibility', () => {
    expect(delayTool.params.duration.visibility).toBe('user-only')
    expect(delayTool.params.unit.visibility).toBe('user-only')
  })

  it('should default unit to seconds', () => {
    expect(delayTool.params.unit.default).toBe('seconds')
  })
})
