import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('QuiverImageToSvgAPI')

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, model, image, temperature, top_p, max_output_tokens, presence_penalty, auto_crop, target_size } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }
    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 })
    }
    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    const requestBody: Record<string, unknown> = { model }

    // Handle image input (could be a URL or base64)
    if (typeof image === 'string') {
      requestBody.image_url = image
    } else if (image && typeof image === 'object') {
      if (image.url) {
        requestBody.image_url = image.url
      } else if (image.data) {
        requestBody.image = image.data
      }
    }

    if (temperature !== undefined) requestBody.temperature = temperature
    if (top_p !== undefined) requestBody.top_p = top_p
    if (max_output_tokens !== undefined) requestBody.max_output_tokens = max_output_tokens
    if (presence_penalty !== undefined) requestBody.presence_penalty = presence_penalty
    if (auto_crop !== undefined) requestBody.auto_crop = auto_crop
    if (target_size !== undefined) requestBody.target_size = target_size

    const response = await fetch('https://api.quiver.ai/v1/svgs/vectorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error('Quiver image-to-svg API error', { status: response.status, data })
      return NextResponse.json(
        { error: data.message || data.error || `Quiver API error: ${response.status}` },
        { status: response.status }
      )
    }

    const results = data.data ?? []
    const firstResult = results[0] ?? {}
    const svgContent = firstResult.content ?? firstResult.svg ?? ''

    return NextResponse.json({
      success: true,
      output: {
        svgContent,
        file: firstResult,
        id: data.id ?? null,
        usage: data.usage
          ? {
              totalTokens: data.usage.total_tokens ?? 0,
              inputTokens: data.usage.prompt_tokens ?? 0,
              outputTokens: data.usage.completion_tokens ?? 0,
            }
          : null,
      },
    })
  } catch (error: any) {
    logger.error('Quiver image-to-svg error', { error: error.message })
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
