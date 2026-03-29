/**
 * Image Search - Embedding Generation Endpoint
 *
 * POST /api/image-search/embed
 *   Generates embeddings for text using available embedding providers.
 *   Reuses the knowledge base embedding infrastructure.
 */

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, model, apiKey } = body

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
    }

    const embeddingModel = model || 'text-embedding-3-small'
    let embedding: number[] = []

    // Detect provider
    const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL
    const isOllamaModel =
      embeddingModel.includes('nomic') ||
      embeddingModel.includes('mxbai') ||
      embeddingModel.includes('bge-')

    if (isOllamaModel && ollamaUrl) {
      // Ollama
      const response = await fetch(`${ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: embeddingModel, prompt: text }),
      })
      if (!response.ok) throw new Error(`Ollama embedding failed: ${response.statusText}`)
      const result = (await response.json()) as { embedding: number[] }
      embedding = result.embedding
    } else {
      // OpenAI
      const openaiKey = apiKey || process.env.OPENAI_API_KEY
      if (!openaiKey) {
        return NextResponse.json(
          { success: false, error: 'API key required for embedding generation' },
          { status: 400 }
        )
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: text,
        }),
      })

      if (!response.ok) throw new Error(`OpenAI embedding failed: ${response.statusText}`)
      const result = (await response.json()) as { data: Array<{ embedding: number[] }> }
      embedding = result.data[0].embedding
    }

    // Normalize to 2000 dimensions for pgvector HNSW index
    const normalized = normalizeEmbedding(embedding, 2000)

    return NextResponse.json({
      success: true,
      embedding: normalized,
      dimensions: normalized.length,
      model: embeddingModel,
    })
  } catch (error) {
    console.error('[Image Search Embed Error]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Embedding generation failed',
      },
      { status: 500 }
    )
  }
}

function normalizeEmbedding(embedding: number[], targetDim: number): number[] {
  if (embedding.length === targetDim) return embedding
  if (embedding.length > targetDim) return embedding.slice(0, targetDim)
  return [...embedding, ...new Array(targetDim - embedding.length).fill(0)]
}
