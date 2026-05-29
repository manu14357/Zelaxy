import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('VideoProxyAPI')

export const dynamic = 'force-dynamic'
export const maxDuration = 600

const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 120

// Helper: poll until done or timeout
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Dimension Helpers ──────────────────────────────────────────────────────

function getVideoDimensions(
  aspectRatio: string | undefined,
  resolution: string | undefined
): { width: number; height: number } {
  const resHeight =
    resolution === '4k' ? 2160 : resolution === '1080p' ? 1080 : resolution === '480p' ? 480 : 720

  const ratioMap: Record<string, [number, number]> = {
    '16:9': [16, 9],
    '9:16': [9, 16],
    '1:1': [1, 1],
    '4:3': [4, 3],
    '3:4': [3, 4],
    '21:9': [21, 9],
  }
  const [w, h] = ratioMap[aspectRatio || '16:9'] || [16, 9]
  const width = Math.round((resHeight * w) / h)
  return { width, height: resHeight }
}

// ─── Runway ─────────────────────────────────────────────────────────────────

async function generateWithRunway(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number,
  aspectRatio: string,
  imageUrl: string | undefined,
  imageFile: any | undefined
): Promise<{ videoUrl: string; width: number; height: number; jobId: string; duration: number }> {
  const dimensions = getVideoDimensions(aspectRatio, '720p')

  const ratioMap: Record<string, string> = {
    '16:9': '1280:720',
    '9:16': '720:1280',
    '1:1': '960:960',
  }
  const runwayRatio = ratioMap[aspectRatio] || '1280:720'

  const createPayload: any = {
    promptText: prompt,
    duration,
    ratio: runwayRatio,
    model: 'gen4_turbo',
  }

  const refUrl = imageUrl || imageFile?.url
  if (refUrl) {
    createPayload.promptImage = refUrl
  }

  const createResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify(createPayload),
  })

  if (!createResponse.ok) {
    const error = await createResponse.text().catch(() => '')
    throw new Error(`Runway API error: ${createResponse.status} - ${error}`)
  }

  const createData: any = await createResponse.json()
  const taskId: string = createData.id
  if (!taskId) throw new Error('Runway response missing task id')

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)

    const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    })

    if (!statusResponse.ok) {
      throw new Error(`Runway status check failed: ${statusResponse.status}`)
    }

    const statusData: any = await statusResponse.json()

    if (statusData.status === 'SUCCEEDED') {
      const videoUrl = statusData.output?.[0]
      if (!videoUrl) throw new Error('No video URL in Runway response')
      return { videoUrl, ...dimensions, jobId: taskId, duration }
    }

    if (statusData.status === 'FAILED') {
      throw new Error(`Runway generation failed: ${statusData.failure || 'Unknown error'}`)
    }
  }

  throw new Error('Runway generation timed out')
}

// ─── Google Veo ─────────────────────────────────────────────────────────────

async function generateWithVeo(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number,
  aspectRatio: string,
  resolution: string
): Promise<{ videoUrl: string; width: number; height: number; jobId: string; duration: number }> {
  const dimensions = getVideoDimensions(aspectRatio, resolution)

  const modelNameMap: Record<string, string> = {
    'veo-3': 'veo-3.0-generate-001',
    'veo-3-fast': 'veo-3.0-fast-generate-001',
    'veo-3.1': 'veo-3.1-generate-preview',
  }
  const modelName = modelNameMap[model] || 'veo-3.0-generate-001'

  const createResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predictLongRunning`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio, resolution, durationSeconds: duration },
      }),
    }
  )

  if (!createResponse.ok) {
    const error = await createResponse.text().catch(() => '')
    throw new Error(`Veo API error: ${createResponse.status} - ${error}`)
  }

  const createData: any = await createResponse.json()
  const operationName: string = createData.name
  if (!operationName) throw new Error('Veo response missing operation name')

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)

    const statusResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
      { headers: { 'x-goog-api-key': apiKey } }
    )

    if (!statusResponse.ok) {
      throw new Error(`Veo status check failed: ${statusResponse.status}`)
    }

    const statusData: any = await statusResponse.json()

    if (statusData.done) {
      if (statusData.error) {
        throw new Error(`Veo generation failed: ${statusData.error.message || 'Unknown error'}`)
      }

      const videoUri =
        statusData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
      if (!videoUri) throw new Error('No video URI in Veo response')

      return { videoUrl: videoUri, ...dimensions, jobId: operationName, duration }
    }
  }

  throw new Error('Veo generation timed out')
}

// ─── Luma Dream Machine ──────────────────────────────────────────────────────

async function generateWithLuma(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number,
  aspectRatio: string,
  resolution: string | undefined,
  cameraMotion: any | undefined
): Promise<{ videoUrl: string; width: number; height: number; jobId: string; duration: number }> {
  const dimensions = getVideoDimensions(aspectRatio, resolution || '720p')

  const createPayload: any = {
    prompt,
    model: model || 'ray-2',
    aspect_ratio: aspectRatio,
    loop: false,
  }

  if (duration) createPayload.duration = `${duration}s`
  if (resolution) createPayload.resolution = resolution
  if (cameraMotion) {
    createPayload.concepts = Array.isArray(cameraMotion) ? cameraMotion : [{ key: cameraMotion }]
  }

  const createResponse = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  })

  if (!createResponse.ok) {
    const error = await createResponse.text().catch(() => '')
    throw new Error(`Luma API error: ${createResponse.status} - ${error}`)
  }

  const createData: any = await createResponse.json()
  const generationId: string = createData.id
  if (!generationId) throw new Error('Luma response missing generation id')

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)

    const statusResponse = await fetch(
      `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    )

    if (!statusResponse.ok) {
      throw new Error(`Luma status check failed: ${statusResponse.status}`)
    }

    const statusData: any = await statusResponse.json()

    if (statusData.state === 'completed') {
      const videoUrl = statusData.assets?.video
      if (!videoUrl) throw new Error('No video URL in Luma response')
      return { videoUrl, ...dimensions, jobId: generationId, duration }
    }

    if (statusData.state === 'failed') {
      throw new Error(`Luma generation failed: ${statusData.failure_reason || 'Unknown error'}`)
    }
  }

  throw new Error('Luma generation timed out')
}

// ─── MiniMax ─────────────────────────────────────────────────────────────────

async function generateWithMiniMax(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number,
  resolution: string | undefined,
  promptOptimizer: boolean | undefined
): Promise<{ videoUrl: string; width: number; height: number; jobId: string; duration: number }> {
  const useHighRes = resolution === '1080P' || resolution === '1080p'
  const finalResolution = useHighRes ? '1080P' : '768P'
  const dimensions = useHighRes ? { width: 1920, height: 1080 } : { width: 1360, height: 768 }

  const modelMap: Record<string, string> = {
    'hailuo-02': 'MiniMax-Hailuo-02',
    'MiniMax-Hailuo-02': 'MiniMax-Hailuo-02',
    'MiniMax-Hailuo-2.3': 'MiniMax-Hailuo-2.3',
  }
  const minimaxModel = modelMap[model] || 'MiniMax-Hailuo-2.3'

  const createResponse = await fetch('https://api.minimax.io/v1/video_generation', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: minimaxModel,
      prompt,
      duration,
      resolution: finalResolution,
      prompt_optimizer: promptOptimizer !== false,
    }),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text().catch(() => '')
    throw new Error(`MiniMax API error: ${createResponse.status} - ${errorText}`)
  }

  const createData: any = await createResponse.json()
  if (createData.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax API error: ${createData.base_resp?.status_msg || 'Unknown error'}`)
  }

  const taskId: string = createData.task_id
  if (!taskId) throw new Error('MiniMax response missing task_id')

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)

    const statusResponse = await fetch(
      `https://api.minimax.io/v1/query/video_generation?task_id=${taskId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    )

    if (!statusResponse.ok) {
      throw new Error(`MiniMax status check failed: ${statusResponse.status}`)
    }

    const statusData: any = await statusResponse.json()

    if (statusData.base_resp?.status_code !== 0 && statusData.base_resp?.status_code !== undefined) {
      throw new Error(
        `MiniMax status error: ${statusData.base_resp?.status_msg || 'Unknown error'}`
      )
    }

    if (statusData.status === 'Success' || statusData.status === 'success') {
      const fileId: string = statusData.file_id
      if (!fileId) throw new Error('No file_id in MiniMax response')

      const fileResponse = await fetch(
        `https://api.minimax.io/v1/files/retrieve?file_id=${fileId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      )

      if (!fileResponse.ok) {
        throw new Error(`Failed to retrieve MiniMax file: ${fileResponse.status}`)
      }

      const fileData: any = await fileResponse.json()
      const videoUrl = fileData.file?.download_url
      if (!videoUrl) throw new Error('No download URL in MiniMax file response')

      return { videoUrl, ...dimensions, jobId: taskId, duration }
    }

    if (statusData.status === 'Failed' || statusData.status === 'failed') {
      throw new Error(`MiniMax generation failed: ${statusData.error || 'Unknown error'}`)
    }
  }

  throw new Error('MiniMax generation timed out')
}

// ─── Fal.ai ─────────────────────────────────────────────────────────────────

async function generateWithFalAI(
  apiKey: string,
  model: string,
  prompt: string,
  duration: number | undefined,
  aspectRatio: string | undefined,
  resolution: string | undefined,
  generateAudio: boolean | undefined
): Promise<{ videoUrl: string; width: number; height: number; jobId: string; duration: number }> {
  const requestBody: any = { prompt }

  if (duration !== undefined) requestBody.duration = duration
  if (aspectRatio) requestBody.aspect_ratio = aspectRatio
  if (resolution) requestBody.resolution = resolution
  if (generateAudio !== undefined) requestBody.generate_audio = generateAudio

  // model is the full fal.ai model endpoint (e.g. "fal-ai/kling-video/v2.1/standard/text-to-video")
  const createResponse = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!createResponse.ok) {
    const error = await createResponse.text().catch(() => '')
    throw new Error(`Fal.ai API error: ${createResponse.status} - ${error}`)
  }

  const createData: any = await createResponse.json()
  const requestId: string = createData.request_id
  if (!requestId) throw new Error('Fal.ai response missing request_id')

  const statusUrl =
    createData.status_url || `https://queue.fal.run/${model}/requests/${requestId}/status`
  const responseUrl =
    createData.response_url || `https://queue.fal.run/${model}/requests/${requestId}/response`

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS)

    const statusResponse = await fetch(statusUrl, {
      headers: { Authorization: `Key ${apiKey}` },
    })

    if (!statusResponse.ok) {
      throw new Error(`Fal.ai status check failed: ${statusResponse.status}`)
    }

    const statusData: any = await statusResponse.json()

    if (statusData.status === 'COMPLETED') {
      if (statusData.error) {
        throw new Error(`Fal.ai generation failed: ${statusData.error}`)
      }

      const resultResponse = await fetch(statusData.response_url || responseUrl, {
        headers: { Authorization: `Key ${apiKey}` },
      })

      if (!resultResponse.ok) {
        throw new Error(`Failed to fetch Fal.ai result: ${resultResponse.status}`)
      }

      const resultData: any = await resultResponse.json()
      const videoUrl = resultData.video?.url || resultData.output?.url
      if (!videoUrl) throw new Error('No video URL in Fal.ai response')

      const width = resultData.video?.width || 1920
      const height = resultData.video?.height || 1080
      const actualDuration = resultData.video?.duration || duration || 5

      return { videoUrl, width, height, jobId: requestId, duration: actualDuration }
    }

    if (['ERROR', 'FAILED', 'CANCELLED'].includes(statusData.status || '')) {
      throw new Error(`Fal.ai generation failed: ${statusData.error || 'Unknown error'}`)
    }
  }

  throw new Error('Fal.ai generation timed out')
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      provider,
      apiKey,
      model,
      prompt,
      duration,
      aspectRatio,
      resolution,
      imageUrl,
      imageFile,
      enableAudio,
      generateAudio,
      // runway-specific
      endImageUrl,
      // luma-specific
      cameraMotion,
      // minimax-specific
      promptOptimizer,
    } = body

    if (!provider) {
      return NextResponse.json({ error: 'provider is required' }, { status: 400 })
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 })
    }
    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    const validProviders = ['runway', 'veo', 'luma', 'minimax', 'falai']
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      )
    }

    logger.info(`Video generation request - provider: ${provider}, model: ${model || 'default'}`)

    let result: {
      videoUrl: string
      width: number
      height: number
      jobId: string
      duration: number
    }

    if (provider === 'runway') {
      result = await generateWithRunway(
        apiKey,
        model || 'gen4_turbo',
        prompt,
        duration || 5,
        aspectRatio || '16:9',
        imageUrl,
        imageFile
      )
    } else if (provider === 'veo') {
      result = await generateWithVeo(
        apiKey,
        model || 'veo-3',
        prompt,
        duration || 8,
        aspectRatio || '16:9',
        resolution || '1080p'
      )
    } else if (provider === 'luma') {
      result = await generateWithLuma(
        apiKey,
        model || 'ray-2',
        prompt,
        duration || 5,
        aspectRatio || '16:9',
        resolution,
        cameraMotion
      )
    } else if (provider === 'minimax') {
      result = await generateWithMiniMax(
        apiKey,
        model || 'MiniMax-Hailuo-2.3',
        prompt,
        duration || 6,
        resolution,
        promptOptimizer
      )
    } else if (provider === 'falai') {
      if (!model) {
        return NextResponse.json(
          { error: 'model is required for Fal.ai provider' },
          { status: 400 }
        )
      }
      result = await generateWithFalAI(
        apiKey,
        model,
        prompt,
        duration,
        aspectRatio,
        resolution,
        generateAudio ?? enableAudio
      )
    } else {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    logger.info(`Video generation completed - provider: ${provider}, jobId: ${result.jobId}`)

    return NextResponse.json({
      videoUrl: result.videoUrl,
      duration: result.duration,
      width: result.width,
      height: result.height,
      provider,
      model: model || 'default',
      jobId: result.jobId,
    })
  } catch (error: any) {
    logger.error('Video generation error', { error: error.message })
    return NextResponse.json(
      { error: error.message || 'Video generation failed' },
      { status: 500 }
    )
  }
}
