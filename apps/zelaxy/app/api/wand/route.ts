import { and, eq } from 'drizzle-orm'
import { unstable_noStore as noStore } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import {
  getWandContent,
  mapWandError,
  runWandGeneration,
  toWandNdjsonResponse,
  type WandMessage,
} from '@/lib/wand/generate'
import { db } from '@/db'
import { workflow } from '@/db/schema'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const logger = createLogger('WandAPI')

interface RequestBody {
  prompt: string
  systemPrompt?: string
  stream?: boolean
  history?: WandMessage[]
  /** Raw key or a `{{ENV_VAR}}` reference. */
  apiKey?: string
  /** Any model id from the provider registry. */
  model?: string
  /** Optional — when provided, membership is verified before generation. */
  workflowId?: string
}

// POST /api/wand — AI wand generation with optional workflow context awareness (any provider/model)
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  logger.info(`[${requestId}] Wand request received`)

  try {
    noStore()

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as RequestBody
    const { prompt, systemPrompt, stream = false, history = [], apiKey, model, workflowId } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: prompt.' },
        { status: 400 }
      )
    }

    // Verify workflow ownership when workflow context is provided.
    if (workflowId) {
      const rows = await db
        .select({ id: workflow.id })
        .from(workflow)
        .where(and(eq(workflow.id, workflowId), eq(workflow.userId, session.user.id)))
        .limit(1)

      if (rows.length === 0) {
        logger.warn(
          `[${requestId}] User ${session.user.id} unauthorized for workflow ${workflowId}`
        )
        return NextResponse.json({ error: 'Access denied to this workflow' }, { status: 403 })
      }
    }

    const resp = await runWandGeneration({
      userId: session.user.id,
      prompt,
      systemPrompt,
      history,
      apiKey,
      model,
      stream,
    })

    if (stream) {
      return toWandNdjsonResponse(resp)
    }

    const content = getWandContent(resp)
    if (!content) {
      return NextResponse.json({ success: false, error: 'AI response was empty.' }, { status: 500 })
    }

    logger.info(`[${requestId}] Wand generation successful`)
    return NextResponse.json({ success: true, content })
  } catch (error: any) {
    const { message, status } = mapWandError(error)
    logger.error(`[${requestId}] Wand generation failed`, { error: error?.message, status })
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
