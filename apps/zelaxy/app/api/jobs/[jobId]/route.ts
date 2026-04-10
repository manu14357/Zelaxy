import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getJobStatus } from '@/lib/bullmq/producer'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'

export const dynamic = 'force-dynamic'

import { createErrorResponse } from '@/app/api/workflows/utils'
import { apiKey as apiKeyTable } from '@/db/schema'

const logger = createLogger('TaskStatusAPI')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId: taskId } = await params
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    logger.debug(`[${requestId}] Getting status for task: ${taskId}`)

    // Try session auth first (for web UI)
    const session = await getSession()
    let authenticatedUserId: string | null = session?.user?.id || null

    if (!authenticatedUserId) {
      const apiKeyHeader = request.headers.get('x-api-key')
      if (apiKeyHeader) {
        const [apiKeyRecord] = await db
          .select({ userId: apiKeyTable.userId })
          .from(apiKeyTable)
          .where(eq(apiKeyTable.key, apiKeyHeader))
          .limit(1)

        if (apiKeyRecord) {
          authenticatedUserId = apiKeyRecord.userId
        }
      }
    }

    if (!authenticatedUserId) {
      return createErrorResponse('Authentication required', 401)
    }

    // Fetch job status from BullMQ
    const jobStatus = await getJobStatus(taskId)

    if (!jobStatus) {
      return createErrorResponse('Task not found', 404)
    }

    logger.debug(`[${requestId}] Task ${taskId} status: ${jobStatus.status}`)

    // Build response matching the existing API format
    const response: any = {
      success: true,
      taskId,
      status: jobStatus.status,
      metadata: {
        startedAt: jobStatus.startedAt || null,
      },
    }

    // Add completion details if finished
    if (jobStatus.status === 'completed') {
      response.output = jobStatus.output
      response.metadata.completedAt = jobStatus.completedAt
        ? new Date(jobStatus.completedAt).toISOString()
        : null
      response.metadata.duration = jobStatus.duration
    }

    // Add error details if failed
    if (jobStatus.status === 'failed') {
      response.error = jobStatus.error
      response.metadata.completedAt = jobStatus.completedAt
        ? new Date(jobStatus.completedAt).toISOString()
        : null
      response.metadata.duration = jobStatus.duration
    }

    // Add progress info if still processing
    if (jobStatus.status === 'processing' || jobStatus.status === 'queued') {
      response.estimatedDuration = 180000 // 3 minutes max
    }

    return NextResponse.json(response)
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching task status:`, error)

    return createErrorResponse('Failed to fetch task status', 500)
  }
}
