import { captureEventTool } from '@/tools/posthog/capture_event'
import { listInsightsTool } from '@/tools/posthog/list_insights'
import { queryTool } from '@/tools/posthog/query'

export const posthogCaptureEventTool = captureEventTool
export const posthogQueryTool = queryTool
export const posthogListInsightsTool = listInsightsTool
