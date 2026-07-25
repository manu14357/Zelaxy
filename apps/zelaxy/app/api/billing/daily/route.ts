import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { processDailyBillingCheck } from '@/lib/billing/core/billing'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('DailyBillingCron')

async function runDailyBillingCheck() {
  logger.info('Starting daily billing check cron job')

  const startTime = Date.now()
  const result = await processDailyBillingCheck()
  const duration = Date.now() - startTime

  if (result.success) {
    logger.info('Daily billing check completed successfully', {
      processedUsers: result.processedUsers,
      processedOrganizations: result.processedOrganizations,
      totalChargedAmount: result.totalChargedAmount,
      duration: `${duration}ms`,
    })

    return NextResponse.json({
      success: true,
      summary: {
        processedUsers: result.processedUsers,
        processedOrganizations: result.processedOrganizations,
        totalChargedAmount: result.totalChargedAmount,
        duration: `${duration}ms`,
      },
    })
  }

  logger.error('Daily billing check completed with errors', {
    processedUsers: result.processedUsers,
    processedOrganizations: result.processedOrganizations,
    totalChargedAmount: result.totalChargedAmount,
    errorCount: result.errors.length,
    errors: result.errors,
    duration: `${duration}ms`,
  })

  return NextResponse.json(
    {
      success: false,
      summary: {
        processedUsers: result.processedUsers,
        processedOrganizations: result.processedOrganizations,
        totalChargedAmount: result.totalChargedAmount,
        errorCount: result.errors.length,
        duration: `${duration}ms`,
      },
      errors: result.errors,
    },
    { status: 500 }
  )
}

/**
 * GET /api/billing/daily - the actual cron entry point.
 *
 * Vercel Cron Jobs always invoke their configured path with GET (this is a
 * platform constraint, not configurable) - this route used to only export
 * POST, with GET wired to an inert "ready" health-check stub that never
 * called processDailyBillingCheck() at all. Combined with vercel.json never
 * listing this path in its crons array in the first place, this job could
 * not have run in production through either path.
 */
export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request, 'daily billing check')
    if (authError) {
      return authError
    }

    return await runDailyBillingCheck()
  } catch (error) {
    logger.error('Fatal error in daily billing cron job', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during daily billing check',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/billing/daily - manual/API-triggered invocation (kept for any
 * existing caller relying on the original method); does the same work as GET.
 */
export async function POST(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request, 'daily billing check')
    if (authError) {
      return authError
    }

    return await runDailyBillingCheck()
  } catch (error) {
    logger.error('Fatal error in daily billing cron job', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during daily billing check',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
