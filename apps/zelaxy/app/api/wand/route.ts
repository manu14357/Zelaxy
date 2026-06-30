import { and, eq } from 'drizzle-orm'
import { unstable_noStore as noStore } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSession } from '@/lib/auth'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { workflow } from '@/db/schema'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const logger = createLogger('WandAPI')

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null

const ALLOWED_MODELS = [
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'gpt-4o',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'o4-mini',
  'o3',
] as const

type AllowedModel = (typeof ALLOWED_MODELS)[number]

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  prompt: string
  systemPrompt?: string
  stream?: boolean
  history?: ChatMessage[]
  apiKey?: string
  model?: string
  /** Optional — when provided, membership is verified before generation */
  workflowId?: string
}

function selectModel(model: string | undefined): string {
  if (model && ALLOWED_MODELS.includes(model as AllowedModel)) return model
  return 'gpt-4o'
}

// POST /api/wand — AI wand generation with optional workflow context awareness
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

    // Verify workflow ownership when workflow context is provided
    if (workflowId) {
      const rows = await db
        .select({ id: workflow.id, userId: workflow.userId })
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

    // Determine OpenAI client
    let client: OpenAI | null = null
    if (apiKey) {
      client = new OpenAI({ apiKey })
    } else if (openai) {
      client = openai
    }

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'No API key configured. Please set up your API key in settings.' },
        { status: 503 }
      )
    }

    const selectedModel = selectModel(model)
    const finalSystemPrompt =
      systemPrompt ||
      'You are a helpful AI assistant. Generate content exactly as requested by the user.'

    const messages: ChatMessage[] = [
      { role: 'system', content: finalSystemPrompt },
      ...history.filter((m) => m.role !== 'system'),
      { role: 'user', content: prompt },
    ]

    if (stream) {
      const streamCompletion = await client.chat.completions.create({
        model: selectedModel,
        messages,
        temperature: 0.3,
        max_tokens: 10000,
        stream: true,
      })

      return new Response(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()
            try {
              for await (const chunk of streamCompletion) {
                const content = chunk.choices[0]?.delta?.content || ''
                if (content) {
                  controller.enqueue(
                    encoder.encode(`${JSON.stringify({ chunk: content, done: false })}\n`)
                  )
                }
              }
              controller.enqueue(encoder.encode(`${JSON.stringify({ chunk: '', done: true })}\n`))
              controller.close()
              logger.info(`[${requestId}] Wand streaming completed`)
            } catch (streamError: any) {
              logger.error(`[${requestId}] Streaming error`, { error: streamError.message })
              controller.enqueue(
                encoder.encode(`${JSON.stringify({ error: 'Streaming failed', done: true })}\n`)
              )
              controller.close()
            }
          },
        }),
        {
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        }
      )
    }

    const completion = await client.chat.completions.create({
      model: selectedModel,
      messages,
      temperature: 0.3,
      max_tokens: 10000,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ success: false, error: 'AI response was empty.' }, { status: 500 })
    }

    logger.info(`[${requestId}] Wand generation successful`)
    return NextResponse.json({ success: true, content })
  } catch (error: any) {
    logger.error(`[${requestId}] Wand generation failed`, { error: error.message })

    let message = 'Wand generation failed. Please try again later.'
    let status = 500

    if (error instanceof OpenAI.APIError) {
      status = error.status || 500
      if (status === 401) message = 'Authentication failed. Please check your API key.'
      else if (status === 429) message = 'Rate limit exceeded. Please try again later.'
      else if (status >= 500)
        message = 'The wand service is currently unavailable. Please try again later.'
    }

    return NextResponse.json({ success: false, error: message }, { status })
  }
}
