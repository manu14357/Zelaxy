import type { ToolConfig } from '@/tools/types'

const awsParams = {
  awsRegion: {
    type: 'string' as const,
    required: true,
    visibility: 'user-only' as const,
    description: 'AWS region (e.g., us-east-1)',
  },
  awsAccessKeyId: {
    type: 'string' as const,
    required: true,
    visibility: 'user-only' as const,
    description: 'AWS access key ID',
  },
  awsSecretAccessKey: {
    type: 'string' as const,
    required: true,
    visibility: 'user-only' as const,
    description: 'AWS secret access key',
  },
}

const awsHeaders = { 'Content-Type': 'application/json' }

export const cloudwatchQueryLogsTool: ToolConfig = {
  id: 'cloudwatch_query_logs',
  name: 'CloudWatch Query Logs',
  description: 'Run a CloudWatch Log Insights query against one or more log groups.',
  version: '1.0.0',
  params: {
    ...awsParams,
    logGroupNames: {
      type: 'array',
      required: true,
      visibility: 'user-or-llm',
      description: 'Log group names to query',
    },
    queryString: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'CloudWatch Log Insights query string',
    },
    startTime: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start time as Unix epoch seconds',
    },
    endTime: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'End time as Unix epoch seconds',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of results to return',
    },
  },
  request: {
    url: '/api/tools/cloudwatch/query-logs',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      logGroupNames: params.logGroupNames,
      queryString: params.queryString,
      startTime: params.startTime,
      endTime: params.endTime,
      ...(params.limit !== undefined && { limit: params.limit }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: unknown }
    if (!response.ok) throw new Error(data.error || 'Failed to query CloudWatch logs')
    return { success: true, output: data.output }
  },
  outputs: {
    results: { type: 'array', description: 'Query results' },
    status: { type: 'string', description: 'Query status' },
  },
}

export const cloudwatchDescribeLogGroupsTool: ToolConfig = {
  id: 'cloudwatch_describe_log_groups',
  name: 'CloudWatch Describe Log Groups',
  description: 'List available CloudWatch log groups.',
  version: '1.0.0',
  params: {
    ...awsParams,
    prefix: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter log groups by name prefix',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of log groups to return',
    },
  },
  request: {
    url: '/api/tools/cloudwatch/describe-log-groups',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      ...(params.prefix && { prefix: params.prefix }),
      ...(params.limit !== undefined && { limit: params.limit }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: { logGroups: unknown[] } }
    if (!response.ok) throw new Error(data.error || 'Failed to describe CloudWatch log groups')
    return { success: true, output: { logGroups: data.output?.logGroups } }
  },
  outputs: { logGroups: { type: 'array', description: 'List of CloudWatch log groups' } },
}

export const cloudwatchGetLogEventsTool: ToolConfig = {
  id: 'cloudwatch_get_log_events',
  name: 'CloudWatch Get Log Events',
  description: 'Retrieve log events from a specific CloudWatch log stream.',
  version: '1.0.0',
  params: {
    ...awsParams,
    logGroupName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'CloudWatch log group name',
    },
    logStreamName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'CloudWatch log stream name',
    },
    startTime: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Start time as Unix epoch seconds',
    },
    endTime: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'End time as Unix epoch seconds',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of events to return',
    },
  },
  request: {
    url: '/api/tools/cloudwatch/get-log-events',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      logGroupName: params.logGroupName,
      logStreamName: params.logStreamName,
      ...(params.startTime !== undefined && { startTime: params.startTime }),
      ...(params.endTime !== undefined && { endTime: params.endTime }),
      ...(params.limit !== undefined && { limit: params.limit }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: { events: unknown[] } }
    if (!response.ok) throw new Error(data.error || 'Failed to get CloudWatch log events')
    return { success: true, output: { events: data.output?.events } }
  },
  outputs: { events: { type: 'array', description: 'Log events with timestamp and message' } },
}

export const cloudwatchListMetricsTool: ToolConfig = {
  id: 'cloudwatch_list_metrics',
  name: 'CloudWatch List Metrics',
  description: 'List available CloudWatch metrics.',
  version: '1.0.0',
  params: {
    ...awsParams,
    namespace: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by namespace (e.g., AWS/EC2, AWS/Lambda)',
    },
    metricName: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by metric name',
    },
    recentlyActive: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Only show metrics active in the last 3 hours',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of metrics to return',
    },
  },
  request: {
    url: '/api/tools/cloudwatch/list-metrics',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      ...(params.namespace && { namespace: params.namespace }),
      ...(params.metricName && { metricName: params.metricName }),
      ...(params.recentlyActive && { recentlyActive: params.recentlyActive }),
      ...(params.limit !== undefined && { limit: params.limit }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: { metrics: unknown[] } }
    if (!response.ok) throw new Error(data.error || 'Failed to list CloudWatch metrics')
    return { success: true, output: { metrics: data.output?.metrics } }
  },
  outputs: { metrics: { type: 'array', description: 'List of CloudWatch metrics' } },
}

export const cloudwatchGetMetricStatisticsTool: ToolConfig = {
  id: 'cloudwatch_get_metric_statistics',
  name: 'CloudWatch Get Metric Statistics',
  description: 'Get statistics for a CloudWatch metric over a time range.',
  version: '1.0.0',
  params: {
    ...awsParams,
    namespace: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Metric namespace (e.g., AWS/EC2, AWS/Lambda)',
    },
    metricName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Metric name (e.g., CPUUtilization)',
    },
    startTime: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start time as Unix epoch seconds',
    },
    endTime: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'End time as Unix epoch seconds',
    },
    period: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Granularity in seconds (e.g., 60, 300, 3600)',
    },
    statistics: {
      type: 'array',
      required: true,
      visibility: 'user-or-llm',
      description: 'Statistics to retrieve (Average, Sum, Minimum, Maximum, SampleCount)',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Dimensions as JSON (e.g., {"InstanceId": "i-1234"})',
    },
  },
  request: {
    url: '/api/tools/cloudwatch/get-metric-statistics',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      namespace: params.namespace,
      metricName: params.metricName,
      startTime: params.startTime,
      endTime: params.endTime,
      period: params.period,
      statistics: params.statistics,
      ...(params.dimensions && { dimensions: params.dimensions }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as {
      error?: string
      output?: { label: string; datapoints: unknown[] }
    }
    if (!response.ok) throw new Error(data.error || 'Failed to get CloudWatch metric statistics')
    return {
      success: true,
      output: { label: data.output?.label, datapoints: data.output?.datapoints },
    }
  },
  outputs: {
    label: { type: 'string', description: 'Metric label returned by CloudWatch' },
    datapoints: { type: 'array', description: 'Datapoints with statistics values' },
  },
}

export const cloudwatchPutMetricDataTool: ToolConfig = {
  id: 'cloudwatch_put_metric_data',
  name: 'CloudWatch Publish Metric',
  description: 'Publish a custom metric data point to CloudWatch.',
  version: '1.0.0',
  params: {
    ...awsParams,
    namespace: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Metric namespace (e.g., Custom/MyApp)',
    },
    metricName: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Name of the metric',
    },
    value: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Metric value to publish',
    },
    unit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Unit of the metric (e.g., Count, Seconds, Bytes)',
    },
    dimensions: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'JSON string of dimension name/value pairs',
    },
  },
  request: {
    url: '/api/tools/cloudwatch/put-metric-data',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      namespace: params.namespace,
      metricName: params.metricName,
      value: params.value,
      ...(params.unit && { unit: params.unit }),
      ...(params.dimensions && { dimensions: params.dimensions }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: unknown }
    if (!response.ok) throw new Error(data.error || 'Failed to publish CloudWatch metric')
    return { success: true, output: data.output }
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the metric was published successfully' },
  },
}

export const cloudwatchDescribeAlarmsTool: ToolConfig = {
  id: 'cloudwatch_describe_alarms',
  name: 'CloudWatch Describe Alarms',
  description: 'List and filter CloudWatch alarms.',
  version: '1.0.0',
  params: {
    ...awsParams,
    alarmNamePrefix: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter alarms by name prefix',
    },
    stateValue: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by alarm state (OK, ALARM, INSUFFICIENT_DATA)',
    },
    alarmType: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by alarm type (MetricAlarm, CompositeAlarm)',
    },
    limit: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum number of alarms to return',
    },
  },
  request: {
    url: '/api/tools/cloudwatch/describe-alarms',
    method: 'POST',
    headers: () => awsHeaders,
    body: (params) => ({
      region: params.awsRegion,
      accessKeyId: params.awsAccessKeyId,
      secretAccessKey: params.awsSecretAccessKey,
      ...(params.alarmNamePrefix && { alarmNamePrefix: params.alarmNamePrefix }),
      ...(params.stateValue && { stateValue: params.stateValue }),
      ...(params.alarmType && { alarmType: params.alarmType }),
      ...(params.limit !== undefined && { limit: params.limit }),
    }),
  },
  transformResponse: async (response) => {
    const data = (await response.json()) as { error?: string; output?: { alarms: unknown[] } }
    if (!response.ok) throw new Error(data.error || 'Failed to describe CloudWatch alarms')
    return { success: true, output: { alarms: data.output?.alarms } }
  },
  outputs: { alarms: { type: 'array', description: 'List of CloudWatch alarms' } },
}
