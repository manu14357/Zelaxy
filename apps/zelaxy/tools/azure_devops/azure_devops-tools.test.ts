/**
 * Request-builder tests for the Azure DevOps tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { azureDevOpsCreateWorkItemTool } from '@/tools/azure_devops/create_work_item'
import { azureDevOpsGetPipelineRunTool } from '@/tools/azure_devops/get_pipeline_run'
import { azureDevOpsGetWorkItemTool } from '@/tools/azure_devops/get_work_item'
import { azureDevOpsListPipelinesTool } from '@/tools/azure_devops/list_pipelines'
import { azureDevOpsQueryWorkItemsTool } from '@/tools/azure_devops/query_work_items'
import { azureDevOpsRunPipelineTool } from '@/tools/azure_devops/run_pipeline'
import { azureDevOpsUpdateWorkItemTool } from '@/tools/azure_devops/update_work_item'

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

describe('Azure DevOps tools', () => {
  it('azure_devops_create_work_item: builds its request', () => {
    expect(azureDevOpsCreateWorkItemTool.id).toBe('azure_devops_create_work_item')
    expect(azureDevOpsCreateWorkItemTool.request.method).toBe('POST')
    const u =
      typeof azureDevOpsCreateWorkItemTool.request.url === 'function'
        ? (azureDevOpsCreateWorkItemTool.request.url as any)(P)
        : azureDevOpsCreateWorkItemTool.request.url
    expect(String(u)).toContain('dev.azure.com')
    expect(Object.keys(azureDevOpsCreateWorkItemTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof azureDevOpsCreateWorkItemTool.transformResponse).toBe('function')
  })

  it('azure_devops_get_pipeline_run: builds its request', () => {
    expect(azureDevOpsGetPipelineRunTool.id).toBe('azure_devops_get_pipeline_run')
    expect(azureDevOpsGetPipelineRunTool.request.method).toBe('GET')
    const u =
      typeof azureDevOpsGetPipelineRunTool.request.url === 'function'
        ? (azureDevOpsGetPipelineRunTool.request.url as any)(P)
        : azureDevOpsGetPipelineRunTool.request.url
    expect(String(u)).toContain('dev.azure.com')
    expect(Object.keys(azureDevOpsGetPipelineRunTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof azureDevOpsGetPipelineRunTool.transformResponse).toBe('function')
  })

  it('azure_devops_get_work_item: builds its request', () => {
    expect(azureDevOpsGetWorkItemTool.id).toBe('azure_devops_get_work_item')
    expect(azureDevOpsGetWorkItemTool.request.method).toBe('GET')
    const u =
      typeof azureDevOpsGetWorkItemTool.request.url === 'function'
        ? (azureDevOpsGetWorkItemTool.request.url as any)(P)
        : azureDevOpsGetWorkItemTool.request.url
    expect(String(u)).toContain('dev.azure.com')
    expect(Object.keys(azureDevOpsGetWorkItemTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof azureDevOpsGetWorkItemTool.transformResponse).toBe('function')
  })

  it('azure_devops_list_pipelines: builds its request', () => {
    expect(azureDevOpsListPipelinesTool.id).toBe('azure_devops_list_pipelines')
    expect(azureDevOpsListPipelinesTool.request.method).toBe('GET')
    const u =
      typeof azureDevOpsListPipelinesTool.request.url === 'function'
        ? (azureDevOpsListPipelinesTool.request.url as any)(P)
        : azureDevOpsListPipelinesTool.request.url
    expect(String(u)).toContain('dev.azure.com')
    expect(Object.keys(azureDevOpsListPipelinesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof azureDevOpsListPipelinesTool.transformResponse).toBe('function')
  })

  it('azure_devops_query_work_items: builds its request', () => {
    expect(azureDevOpsQueryWorkItemsTool.id).toBe('azure_devops_query_work_items')
    expect(azureDevOpsQueryWorkItemsTool.request.method).toBe('POST')
    const u =
      typeof azureDevOpsQueryWorkItemsTool.request.url === 'function'
        ? (azureDevOpsQueryWorkItemsTool.request.url as any)(P)
        : azureDevOpsQueryWorkItemsTool.request.url
    expect(String(u)).toContain('dev.azure.com')
    expect(Object.keys(azureDevOpsQueryWorkItemsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof azureDevOpsQueryWorkItemsTool.transformResponse).toBe('function')
  })

  it('azure_devops_run_pipeline: builds its request', () => {
    expect(azureDevOpsRunPipelineTool.id).toBe('azure_devops_run_pipeline')
    expect(azureDevOpsRunPipelineTool.request.method).toBe('POST')
    const u =
      typeof azureDevOpsRunPipelineTool.request.url === 'function'
        ? (azureDevOpsRunPipelineTool.request.url as any)(P)
        : azureDevOpsRunPipelineTool.request.url
    expect(String(u)).toContain('dev.azure.com')
    expect(Object.keys(azureDevOpsRunPipelineTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof azureDevOpsRunPipelineTool.transformResponse).toBe('function')
  })

  it('azure_devops_update_work_item: builds its request', () => {
    expect(azureDevOpsUpdateWorkItemTool.id).toBe('azure_devops_update_work_item')
    expect(azureDevOpsUpdateWorkItemTool.request.method).toBe('PATCH')
    const u =
      typeof azureDevOpsUpdateWorkItemTool.request.url === 'function'
        ? (azureDevOpsUpdateWorkItemTool.request.url as any)(P)
        : azureDevOpsUpdateWorkItemTool.request.url
    expect(String(u)).toContain('dev.azure.com')
    expect(Object.keys(azureDevOpsUpdateWorkItemTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof azureDevOpsUpdateWorkItemTool.transformResponse).toBe('function')
  })
})
