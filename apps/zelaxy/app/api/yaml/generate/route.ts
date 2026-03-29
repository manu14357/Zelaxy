import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLogger } from '@/lib/logs/console/logger'
import { getAllBlocks } from '@/blocks/registry'
import type { BlockConfig } from '@/blocks/types'
import { resolveOutputType } from '@/blocks/utils'
import { generateLoopBlocks, generateParallelBlocks } from '@/stores/workflows/workflow/utils'

const logger = createLogger('YamlGenerateAPI')

// Zelaxy Agent API configuration
const ZELAXY_AGENT_API_URL = process.env.ZELAXY_AGENT_API_URL || 'http://localhost:8000'
const ZELAXY_AGENT_API_KEY = process.env.ZELAXY_AGENT_API_KEY

const GenerateRequestSchema = z.object({
  workflowState: z.any(), // Let the yaml service handle validation
  subBlockValues: z.record(z.record(z.any())).optional(),
})

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const body = await request.json()
    const { workflowState, subBlockValues } = GenerateRequestSchema.parse(body)

    logger.info(`[${requestId}] Generating YAML from workflow`, {
      blocksCount: workflowState.blocks ? Object.keys(workflowState.blocks).length : 0,
      edgesCount: workflowState.edges ? workflowState.edges.length : 0,
      hasApiKey: !!ZELAXY_AGENT_API_KEY,
    })

    // Gather block registry and utilities
    const blocks = getAllBlocks()
    const blockRegistry = blocks.reduce(
      (acc, block) => {
        const blockType = block.type
        acc[blockType] = {
          ...block,
          id: blockType,
          subBlocks: block.subBlocks || [],
          outputs: block.outputs || {},
        } as any
        return acc
      },
      {} as Record<string, BlockConfig>
    )

    // Call zelaxy-agent API
    const response = await fetch(`${ZELAXY_AGENT_API_URL}/api/workflow/to-yaml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ZELAXY_AGENT_API_KEY && { 'x-api-key': ZELAXY_AGENT_API_KEY }),
      },
      body: JSON.stringify({
        workflowState,
        subBlockValues,
        blockRegistry,
        utilities: {
          generateLoopBlocks: generateLoopBlocks.toString(),
          generateParallelBlocks: generateParallelBlocks.toString(),
          resolveOutputType: resolveOutputType.toString(),
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`[${requestId}] Zelaxy agent API error:`, {
        status: response.status,
        error: errorText,
      })
      return NextResponse.json(
        { success: false, error: `Zelaxy agent API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    logger.error(`[${requestId}] YAML generation failed:`, error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
