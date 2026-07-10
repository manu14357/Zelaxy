/**
 * Request-builder tests for the CloudFormation tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  cloudformationDescribeStackEventsTool,
  cloudformationDescribeStacksTool,
  cloudformationDetectStackDriftTool,
  cloudformationGetTemplateTool,
  cloudformationListStackResourcesTool,
  cloudformationValidateTemplateTool,
} from '@/tools/cloudformation'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  userId: 'u',
  organizationId: 'org',
  sessionId: 's',
  zoneId: 'z',
  recordId: 'r',
  host: 'https://h.clickhouse.cloud:8443',
  sql: 'SELECT 1',
  username: 'u',
  password: 'p',
  deploymentUrl: 'https://a.convex.cloud',
  adminKey: 'ak',
  path: 'p',
  url: 'https://example.com/page',
  query: 'q',
  agentId: 'ag',
  pageId: 'pg',
  stackName: 'st',
  id: 'id',
}

describe('CloudFormation tools', () => {
  it('cloudformation_describe_stacks: builds its request', () => {
    expect(cloudformationDescribeStacksTool.id).toBe('cloudformation_describe_stacks')
    expect(cloudformationDescribeStacksTool.request.method).toBe('POST')
    const u =
      typeof cloudformationDescribeStacksTool.request.url === 'function'
        ? (cloudformationDescribeStacksTool.request.url as any)(P)
        : cloudformationDescribeStacksTool.request.url
    expect(String(u)).toContain('/api/tools/cloudformation/')
    expect(Object.keys(cloudformationDescribeStacksTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudformationDescribeStacksTool.transformResponse).toBe('function')
  })

  it('cloudformation_list_stack_resources: builds its request', () => {
    expect(cloudformationListStackResourcesTool.id).toBe('cloudformation_list_stack_resources')
    expect(cloudformationListStackResourcesTool.request.method).toBe('POST')
    const u =
      typeof cloudformationListStackResourcesTool.request.url === 'function'
        ? (cloudformationListStackResourcesTool.request.url as any)(P)
        : cloudformationListStackResourcesTool.request.url
    expect(String(u)).toContain('/api/tools/cloudformation/')
    expect(Object.keys(cloudformationListStackResourcesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudformationListStackResourcesTool.transformResponse).toBe('function')
  })

  it('cloudformation_describe_stack_events: builds its request', () => {
    expect(cloudformationDescribeStackEventsTool.id).toBe('cloudformation_describe_stack_events')
    expect(cloudformationDescribeStackEventsTool.request.method).toBe('POST')
    const u =
      typeof cloudformationDescribeStackEventsTool.request.url === 'function'
        ? (cloudformationDescribeStackEventsTool.request.url as any)(P)
        : cloudformationDescribeStackEventsTool.request.url
    expect(String(u)).toContain('/api/tools/cloudformation/')
    expect(Object.keys(cloudformationDescribeStackEventsTool.params ?? {}).length).toBeGreaterThan(
      0
    )
    expect(typeof cloudformationDescribeStackEventsTool.transformResponse).toBe('function')
  })

  it('cloudformation_detect_stack_drift: builds its request', () => {
    expect(cloudformationDetectStackDriftTool.id).toBe('cloudformation_detect_stack_drift')
    expect(cloudformationDetectStackDriftTool.request.method).toBe('POST')
    const u =
      typeof cloudformationDetectStackDriftTool.request.url === 'function'
        ? (cloudformationDetectStackDriftTool.request.url as any)(P)
        : cloudformationDetectStackDriftTool.request.url
    expect(String(u)).toContain('/api/tools/cloudformation/')
    expect(Object.keys(cloudformationDetectStackDriftTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudformationDetectStackDriftTool.transformResponse).toBe('function')
  })

  it('cloudformation_get_template: builds its request', () => {
    expect(cloudformationGetTemplateTool.id).toBe('cloudformation_get_template')
    expect(cloudformationGetTemplateTool.request.method).toBe('POST')
    const u =
      typeof cloudformationGetTemplateTool.request.url === 'function'
        ? (cloudformationGetTemplateTool.request.url as any)(P)
        : cloudformationGetTemplateTool.request.url
    expect(String(u)).toContain('/api/tools/cloudformation/')
    expect(Object.keys(cloudformationGetTemplateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudformationGetTemplateTool.transformResponse).toBe('function')
  })

  it('cloudformation_validate_template: builds its request', () => {
    expect(cloudformationValidateTemplateTool.id).toBe('cloudformation_validate_template')
    expect(cloudformationValidateTemplateTool.request.method).toBe('POST')
    const u =
      typeof cloudformationValidateTemplateTool.request.url === 'function'
        ? (cloudformationValidateTemplateTool.request.url as any)(P)
        : cloudformationValidateTemplateTool.request.url
    expect(String(u)).toContain('/api/tools/cloudformation/')
    expect(Object.keys(cloudformationValidateTemplateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudformationValidateTemplateTool.transformResponse).toBe('function')
  })
})
