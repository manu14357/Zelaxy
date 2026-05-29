import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'

export const dynamic = 'force-dynamic'

const logger = createLogger('CredentialSetsAPI')

// Credential sets are an enterprise feature — requires a separate DB table
// and billing plan check. Returning appropriate responses until the feature
// is fully provisioned.

export async function GET() {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug(`[${requestId}] Credential sets requested by ${session.user.id}`)

    return NextResponse.json({
      credentialSets: [],
      total: 0,
    })
  } catch (error) {
    logger.error(`[${requestId}] Error fetching credential sets:`, error)
    return NextResponse.json({ error: 'Failed to fetch credential sets' }, { status: 500 })
  }
}

export async function POST() {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    { error: 'Credential sets require a Team or Enterprise plan' },
    { status: 403 }
  )
}
