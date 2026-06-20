import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { isHosted } from '@/lib/environment'
import { resolveKeyAvailability } from '@/lib/providers/api-keys'
import { db } from '@/db'
import { environment } from '@/db/schema'
import { getProviderFromModel } from '@/providers/utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/providers/key-status?model=<id>  (or ?provider=<id>)
 * Reports whether a usable API key exists for the model's provider — checking hosted rotation,
 * server env, and the user's configured Environment Variables. Used to decide whether to prompt
 * the user for a key before running with a selected model.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const model = url.searchParams.get('model')
  const providerParam = url.searchParams.get('provider')
  if (!model && !providerParam) {
    return NextResponse.json({ error: 'model or provider is required' }, { status: 400 })
  }

  const provider = (providerParam as any) || getProviderFromModel(model!)

  // The names of env vars the user has configured (values are encrypted; we only need names).
  let userEnvVarNames = new Set<string>()
  try {
    const [row] = await db
      .select({ variables: environment.variables })
      .from(environment)
      .where(eq(environment.userId, session.user.id))
      .limit(1)
    if (row?.variables && typeof row.variables === 'object') {
      userEnvVarNames = new Set(Object.keys(row.variables as Record<string, unknown>))
    }
  } catch {
    // Treat as no user env vars.
  }

  const result = resolveKeyAvailability({
    provider,
    isHosted,
    hasServerEnv: (name) => !!process.env[name],
    userEnvVarNames,
  })

  return NextResponse.json(result)
}
