import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('YamlHealthAPI')

// Zelaxy Agent API configuration
const ZELAXY_AGENT_API_URL = process.env.ZELAXY_AGENT_API_URL || 'http://localhost:8000'
const ZELAXY_AGENT_API_KEY = process.env.ZELAXY_AGENT_API_KEY

export async function GET() {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    logger.info(`[${requestId}] Checking YAML service health`, {
      hasApiKey: !!ZELAXY_AGENT_API_KEY,
    })

    // Check zelaxy-agent health
    const response = await fetch(`${ZELAXY_AGENT_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(ZELAXY_AGENT_API_KEY && { 'x-api-key': ZELAXY_AGENT_API_KEY }),
      },
    })

    const isHealthy = response.ok

    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      service: 'yaml',
    })
  } catch (error) {
    logger.error(`[${requestId}] YAML health check failed:`, error)

    return NextResponse.json(
      {
        success: false,
        healthy: false,
        service: 'yaml',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
