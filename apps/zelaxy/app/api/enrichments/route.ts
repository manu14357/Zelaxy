import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { ALL_ENRICHMENTS, getEnrichment } from '@/lib/enrichments/registry'
import { runEnrichment } from '@/lib/enrichments/run'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('EnrichmentsAPI')

/** GET /api/enrichments — list available enrichments (catalog). */
export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    enrichments: ALL_ENRICHMENTS.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      inputs: e.inputs,
      outputs: e.outputs,
      providers: e.providers.map((p) => ({ id: p.id, label: p.label })),
    })),
  })
}

/**
 * POST /api/enrichments — run an enrichment cascade.
 * Body: { enrichmentId, inputs: {...}, credentials?: { [providerId]: apiKey } }
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

  const enrichment = getEnrichment(body?.enrichmentId)
  if (!enrichment) {
    return NextResponse.json(
      { error: `Unknown enrichmentId: ${body?.enrichmentId}` },
      { status: 400 }
    )
  }

  try {
    const outcome = await runEnrichment(enrichment, body.inputs || {}, {
      workspaceId: body.workspaceId,
      credentials: body.credentials || {},
    })
    return NextResponse.json({ success: true, ...outcome })
  } catch (error: any) {
    logger.error('Enrichment run failed', { error: error?.message })
    return NextResponse.json(
      { success: false, error: error?.message || 'Enrichment failed' },
      { status: 500 }
    )
  }
}
