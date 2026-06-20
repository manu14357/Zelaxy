import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { runGuardrailsValidation } from '@/lib/guardrails/run'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('GuardrailsValidateAPI')

/**
 * Public guardrails validation endpoint.
 *
 * POST /api/guardrails/validate
 * Body: { validationType: 'json'|'regex'|'hallucination'|'pii', input, ...options }
 *
 * Validates content for structured-output conformance (json), pattern match (regex), PII
 * (detect/mask), or hallucination against a knowledge base. Authenticated via session.
 */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const output = await runGuardrailsValidation(body)
    return NextResponse.json({ success: true, output })
  } catch (error: any) {
    logger.error('Guardrails validation failed', { error: error?.message })
    return NextResponse.json(
      {
        success: false,
        output: {
          passed: false,
          validationType: body?.validationType || 'unknown',
          input: typeof body?.input === 'string' ? body.input : '',
          error: error?.message || 'Validation failed',
        },
      },
      { status: 500 }
    )
  }
}
