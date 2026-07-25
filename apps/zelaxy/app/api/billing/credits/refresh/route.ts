import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { processDailyCreditRefresh } from '@/lib/billing/credits/refresh'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('CreditRefreshCron')

async function runCreditRefresh() {
  logger.info('Starting daily credit refresh cron job')

  const startTime = Date.now()
  const result = await processDailyCreditRefresh()
  const duration = Date.now() - startTime

  if (result.success) {
    logger.info('Daily credit refresh completed successfully', {
      processedUsers: result.processedUsers,
      totalRefreshed: result.totalRefreshed,
      duration: `${duration}ms`,
    })

    return NextResponse.json({
      success: true,
      summary: {
        processedUsers: result.processedUsers,
        totalRefreshed: result.totalRefreshed,
        duration: `${duration}ms`,
      },
    })
  }

  logger.error('Daily credit refresh completed with errors', {
    processedUsers: result.processedUsers,
    totalRefreshed: result.totalRefreshed,
    errorCount: result.errors.length,
    errors: result.errors,
    duration: `${duration}ms`,
  })

  return NextResponse.json(
    {
      success: false,
      summary: {
        processedUsers: result.processedUsers,
        totalRefreshed: result.totalRefreshed,
        errorCount: result.errors.length,
        duration: `${duration}ms`,
      },
      errors: result.errors,
    },
    { status: 500 }
  )
}

/**
 * GET /api/billing/credits/refresh - the actual Vercel Cron entry point.
 * Vercel Cron always invokes with GET (see app/api/billing/daily/route.ts
 * for the same constraint, which previously bit this exact endpoint shape).
 */
export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request, 'daily credit refresh')
    if (authError) {
      return authError
    }

    return await runCreditRefresh()
  } catch (error) {
    logger.error('Fatal error in daily credit refresh cron job', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during daily credit refresh',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/billing/credits/refresh - manual/API-triggered invocation; does
 * the same work as GET.
 */
export async function POST(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request, 'daily credit refresh')
    if (authError) {
      return authError
    }

    return await runCreditRefresh()
  } catch (error) {
    logger.error('Fatal error in daily credit refresh cron job', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during daily credit refresh',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
