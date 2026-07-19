import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONCURRENCY, getWebhookConcurrency, getWorkflowConcurrency } from './concurrency'
import { QUEUE_NAMES } from './types'

describe('bullmq queue names', () => {
  it('keeps the historical llm-jobs name for the workflow queue (in-flight drain)', () => {
    expect(QUEUE_NAMES.WORKFLOW).toBe('llm-jobs')
  })

  it('uses a dedicated webhook queue distinct from the workflow queue', () => {
    expect(QUEUE_NAMES.WEBHOOK).toBe('webhook-jobs')
    expect(QUEUE_NAMES.WEBHOOK).not.toBe(QUEUE_NAMES.WORKFLOW)
  })
})

describe('per-job-type concurrency resolution', () => {
  const ENV_KEYS = ['WORKER_CONCURRENCY', 'WORKFLOW_CONCURRENCY', 'WEBHOOK_CONCURRENCY'] as const

  beforeEach(() => {
    // vi.stubEnv(name, undefined) unsets the var; vi.unstubAllEnvs() restores.
    for (const key of ENV_KEYS) vi.stubEnv(key, undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('BACK-COMPAT: with nothing set, both fall back to the default (5)', () => {
    expect(getWorkflowConcurrency()).toBe(DEFAULT_CONCURRENCY)
    expect(getWebhookConcurrency()).toBe(DEFAULT_CONCURRENCY)
    expect(DEFAULT_CONCURRENCY).toBe(5)
  })

  it('BACK-COMPAT: WORKER_CONCURRENCY alone applies to both job types', () => {
    vi.stubEnv('WORKER_CONCURRENCY', '12')
    expect(getWorkflowConcurrency()).toBe(12)
    expect(getWebhookConcurrency()).toBe(12)
  })

  it('per-type vars override the shared fallback independently', () => {
    vi.stubEnv('WORKER_CONCURRENCY', '12')
    vi.stubEnv('WORKFLOW_CONCURRENCY', '20')
    vi.stubEnv('WEBHOOK_CONCURRENCY', '3')
    expect(getWorkflowConcurrency()).toBe(20)
    expect(getWebhookConcurrency()).toBe(3)
  })

  it('a per-type var can override while the other still uses the fallback', () => {
    vi.stubEnv('WORKER_CONCURRENCY', '8')
    vi.stubEnv('WEBHOOK_CONCURRENCY', '2')
    expect(getWorkflowConcurrency()).toBe(8)
    expect(getWebhookConcurrency()).toBe(2)
  })

  it('falls back through invalid values (non-numeric, zero, negative, empty)', () => {
    for (const bad of ['abc', '0', '-4', '']) {
      vi.stubEnv('WORKFLOW_CONCURRENCY', bad)
      expect(getWorkflowConcurrency()).toBe(DEFAULT_CONCURRENCY)
      vi.stubEnv('WORKER_CONCURRENCY', '7')
      expect(getWorkflowConcurrency()).toBe(7)
      vi.stubEnv('WORKER_CONCURRENCY', undefined)
    }
  })
})

describe('producer routes jobs to their own queue', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('addWorkflowJob -> workflow queue, addWebhookJob -> webhook queue', async () => {
    const workflowAdd = vi.fn(async (_name: string, _payload: unknown, _opts?: unknown) => ({
      id: 'wf-abc-1',
    }))
    const webhookAdd = vi.fn(async (_name: string, _payload: unknown, _opts?: unknown) => ({
      id: 'wh-xyz-2',
    }))

    vi.doMock('./queues', () => ({
      getWorkflowQueue: () => ({ add: workflowAdd }),
      getWebhookQueue: () => ({ add: webhookAdd }),
    }))

    const { addWorkflowJob, addWebhookJob } = await import('./producer')

    const wf = await addWorkflowJob({ workflowId: 'abc', userId: 'u1' })
    expect(wf.jobId).toBe('wf-abc-1')
    expect(workflowAdd).toHaveBeenCalledTimes(1)
    expect(webhookAdd).not.toHaveBeenCalled()
    expect(workflowAdd.mock.calls[0][0]).toBe('workflow-execution')

    const wh = await addWebhookJob({
      webhookId: 'xyz',
      workflowId: 'abc',
      userId: 'u1',
      provider: 'generic',
      body: {},
      headers: {},
      path: '/hook',
    })
    expect(wh.jobId).toBe('wh-xyz-2')
    expect(webhookAdd).toHaveBeenCalledTimes(1)
    expect(webhookAdd.mock.calls[0][0]).toBe('webhook-execution')
  })
})
