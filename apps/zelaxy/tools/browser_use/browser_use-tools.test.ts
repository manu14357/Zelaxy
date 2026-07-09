/**
 * Request-builder tests for the Browser Use tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { runTaskTool } from '@/tools/browser_use/run_task'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  organization: 'org',
  project: 'proj',
  pipelineId: 'pl',
  runId: 'r',
  workItemId: '1',
  id: 'id',
  fileId: 'f',
  folderId: '0',
  brandId: 'b',
  domain: 'x.com',
  query: 'q',
  webhookURL: 'https://clay.example/webhook',
  bookingUid: 'bk',
  eventTypeId: 'et',
  uuid: 'uid',
  uri: 'https://api.calendly.com/x',
  userUri: 'https://api.calendly.com/u',
  inviteeUuid: 'iv',
  secretId: 's',
  taskId: 't',
}

describe('Browser Use tools', () => {
  it('browser_use_run_task: builds its request', () => {
    expect(runTaskTool.id).toBe('browser_use_run_task')
    expect(runTaskTool.request.method).toBe('POST')
    const u =
      typeof runTaskTool.request.url === 'function'
        ? (runTaskTool.request.url as any)(P)
        : runTaskTool.request.url
    expect(String(u)).toContain('api.browser-use.com')
    expect(Object.keys(runTaskTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof runTaskTool.transformResponse).toBe('function')
  })
})
