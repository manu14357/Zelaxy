import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/auth/internal'
import { processThresholdBillingCheck } from '@/lib/billing/threshold-billing'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('ThresholdBillingCron')

async function runThresholdBillingCheck() {
  logger.info('Starting threshold billing poll')

  const startTime = Date.now()
  const result = await processThresholdBillingCheck()
  const duration = Date.now() - startTime

  if (result.success) {
    logger.info('Threshold billing poll completed successfully', {
      candidateCount: result.candidateCount,
      settledCount: result.settledCount,
      totalCharged: result.totalCharged,
      totalCreditsApplied: result.totalCreditsApplied,
      duration: `${duration}ms`,
    })

    return NextResponse.json({
      success: true,
      summary: {
        candidateCount: result.candidateCount,
        settledCount: result.settledCount,
        totalCharged: result.totalCharged,
        totalCreditsApplied: result.totalCreditsApplied,
        duration: `${duration}ms`,
      },
    })
  }

  logger.error('Threshold billing poll completed with errors', {
    candidateCount: result.candidateCount,
    settledCount: result.settledCount,
    errorCount: result.errors.length,
    errors: result.errors,
    duration: `${duration}ms`,
  })

  return NextResponse.json(
    {
      success: false,
      summary: {
        candidateCount: result.candidateCount,
        settledCount: result.settledCount,
        totalCharged: result.totalCharged,
        totalCreditsApplied: result.totalCreditsApplied,
        errorCount: result.errors.length,
        duration: `${duration}ms`,
      },
      errors: result.errors,
    },
    { status: 500 }
  )
}

/**
 * GET /api/billing/threshold - the actual Vercel Cron entry point (see
 * app/api/billing/daily/route.ts for why GET, not POST, is what matters).
 * Runs frequently (production: every ~20 minutes, see vercel.json) to catch
 * mid-cycle overage crossings - see lib/billing/threshold-billing.ts for why
 * this is a poll rather than a synchronous per-execution check.
 */
export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request, 'threshold billing check')
    if (authError) {
      return authError
    }

    return await runThresholdBillingCheck()
  } catch (error) {
    logger.error('Fatal error in threshold billing cron job', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during threshold billing check',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/billing/threshold - manual/API-triggered invocation; does the
 * same work as GET.
 */
export async function POST(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request, 'threshold billing check')
    if (authError) {
      return authError
    }

    return await runThresholdBillingCheck()
  } catch (error) {
    logger.error('Fatal error in threshold billing cron job', { error })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during threshold billing check',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
