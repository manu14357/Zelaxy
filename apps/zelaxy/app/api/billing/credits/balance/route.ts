import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCreditBalance } from '@/lib/billing/credits/balance'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('CreditBalanceAPI')

/**
 * GET /api/billing/credits/balance - the current user's prepaid credit balance.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const balance = await getCreditBalance(session.user.id)
    return NextResponse.json({ balance })
  } catch (error) {
    logger.error('Failed to fetch credit balance', { error })
    return NextResponse.json({ error: 'Failed to fetch credit balance' }, { status: 500 })
  }
}
