/**
 * Request-builder tests for the CloudWatch tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  cloudwatchDescribeAlarmsTool,
  cloudwatchDescribeLogGroupsTool,
  cloudwatchGetLogEventsTool,
  cloudwatchGetMetricStatisticsTool,
  cloudwatchListMetricsTool,
  cloudwatchPutMetricDataTool,
  cloudwatchQueryLogsTool,
} from '@/tools/cloudwatch'

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

describe('CloudWatch tools', () => {
  it('cloudwatch_query_logs: builds its request', () => {
    expect(cloudwatchQueryLogsTool.id).toBe('cloudwatch_query_logs')
    expect(cloudwatchQueryLogsTool.request.method).toBe('POST')
    const u =
      typeof cloudwatchQueryLogsTool.request.url === 'function'
        ? (cloudwatchQueryLogsTool.request.url as any)(P)
        : cloudwatchQueryLogsTool.request.url
    expect(String(u)).toContain('/api/tools/cloudwatch/')
    expect(Object.keys(cloudwatchQueryLogsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudwatchQueryLogsTool.transformResponse).toBe('function')
  })

  it('cloudwatch_describe_log_groups: builds its request', () => {
    expect(cloudwatchDescribeLogGroupsTool.id).toBe('cloudwatch_describe_log_groups')
    expect(cloudwatchDescribeLogGroupsTool.request.method).toBe('POST')
    const u =
      typeof cloudwatchDescribeLogGroupsTool.request.url === 'function'
        ? (cloudwatchDescribeLogGroupsTool.request.url as any)(P)
        : cloudwatchDescribeLogGroupsTool.request.url
    expect(String(u)).toContain('/api/tools/cloudwatch/')
    expect(Object.keys(cloudwatchDescribeLogGroupsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudwatchDescribeLogGroupsTool.transformResponse).toBe('function')
  })

  it('cloudwatch_get_log_events: builds its request', () => {
    expect(cloudwatchGetLogEventsTool.id).toBe('cloudwatch_get_log_events')
    expect(cloudwatchGetLogEventsTool.request.method).toBe('POST')
    const u =
      typeof cloudwatchGetLogEventsTool.request.url === 'function'
        ? (cloudwatchGetLogEventsTool.request.url as any)(P)
        : cloudwatchGetLogEventsTool.request.url
    expect(String(u)).toContain('/api/tools/cloudwatch/')
    expect(Object.keys(cloudwatchGetLogEventsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudwatchGetLogEventsTool.transformResponse).toBe('function')
  })

  it('cloudwatch_list_metrics: builds its request', () => {
    expect(cloudwatchListMetricsTool.id).toBe('cloudwatch_list_metrics')
    expect(cloudwatchListMetricsTool.request.method).toBe('POST')
    const u =
      typeof cloudwatchListMetricsTool.request.url === 'function'
        ? (cloudwatchListMetricsTool.request.url as any)(P)
        : cloudwatchListMetricsTool.request.url
    expect(String(u)).toContain('/api/tools/cloudwatch/')
    expect(Object.keys(cloudwatchListMetricsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudwatchListMetricsTool.transformResponse).toBe('function')
  })

  it('cloudwatch_get_metric_statistics: builds its request', () => {
    expect(cloudwatchGetMetricStatisticsTool.id).toBe('cloudwatch_get_metric_statistics')
    expect(cloudwatchGetMetricStatisticsTool.request.method).toBeTruthy()
    const u =
      typeof cloudwatchGetMetricStatisticsTool.request.url === 'function'
        ? (cloudwatchGetMetricStatisticsTool.request.url as any)(P)
        : cloudwatchGetMetricStatisticsTool.request.url
    expect(String(u)).toContain('/api/tools/cloudwatch/')
    expect(Object.keys(cloudwatchGetMetricStatisticsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudwatchGetMetricStatisticsTool.transformResponse).toBe('function')
  })

  it('cloudwatch_put_metric_data: builds its request', () => {
    expect(cloudwatchPutMetricDataTool.id).toBe('cloudwatch_put_metric_data')
    expect(cloudwatchPutMetricDataTool.request.method).toBe('POST')
    const u =
      typeof cloudwatchPutMetricDataTool.request.url === 'function'
        ? (cloudwatchPutMetricDataTool.request.url as any)(P)
        : cloudwatchPutMetricDataTool.request.url
    expect(String(u)).toContain('/api/tools/cloudwatch/')
    expect(Object.keys(cloudwatchPutMetricDataTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudwatchPutMetricDataTool.transformResponse).toBe('function')
  })

  it('cloudwatch_describe_alarms: builds its request', () => {
    expect(cloudwatchDescribeAlarmsTool.id).toBe('cloudwatch_describe_alarms')
    expect(cloudwatchDescribeAlarmsTool.request.method).toBe('POST')
    const u =
      typeof cloudwatchDescribeAlarmsTool.request.url === 'function'
        ? (cloudwatchDescribeAlarmsTool.request.url as any)(P)
        : cloudwatchDescribeAlarmsTool.request.url
    expect(String(u)).toContain('/api/tools/cloudwatch/')
    expect(Object.keys(cloudwatchDescribeAlarmsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof cloudwatchDescribeAlarmsTool.transformResponse).toBe('function')
  })
})
