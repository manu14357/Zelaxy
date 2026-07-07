/**
 * Functional tests for the workflow_executor tool (used by the Workflow blocks).
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { workflowExecutorTool } from '@/tools/workflow/executor'

describe('workflow_executor tool', () => {
  it('posts to the workflow-executor endpoint', () => {
    expect(workflowExecutorTool.request.url).toBe('/api/tools/workflow-executor')
    expect(workflowExecutorTool.request.method).toBe('POST')
  })

  it('passes params through as the request body', () => {
    const params = { workflowId: 'wf-child', inputMapping: { a: '<start.a>' } } as any
    expect(workflowExecutorTool.request.body!(params)).toBe(params)
  })

  it('fills defaults when the response is empty', async () => {
    const out = await workflowExecutorTool.transformResponse!({} as any)
    expect(out).toMatchObject({
      success: false,
      duration: 0,
      childWorkflowId: '',
      childWorkflowName: '',
    })
  })

  it('passes through a successful child-workflow result', async () => {
    const out = await workflowExecutorTool.transformResponse!({
      success: true,
      duration: 120,
      childWorkflowId: 'wf-1',
      childWorkflowName: 'Child',
      result: { answer: 42 },
    } as any)
    expect(out.success).toBe(true)
    expect(out.childWorkflowId).toBe('wf-1')
    expect((out as any).result).toEqual({ answer: 42 })
  })
})
