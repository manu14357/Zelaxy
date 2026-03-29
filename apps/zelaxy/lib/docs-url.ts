import type { BlockCategory } from '@/blocks/types'

/**
 * Special mappings for block types whose registry key doesn't directly
 * convert to the docs slug via simple underscore→hyphen replacement.
 */
const BLOCK_TYPE_TO_DOC_SLUG: Record<string, string> = {
  twilio_sms: 'twilio',
}

/**
 * Block types that have no dedicated documentation page.
 */
const BLOCKS_WITHOUT_DOCS = new Set(['smtp'])

/**
 * Default docs base URL (the docs Next.js app).
 * Can be overridden via NEXT_PUBLIC_DOCUMENTATION_URL env var.
 */
const DEFAULT_DOCS_BASE = 'http://docs.localhost:3001'

/**
 * Get the docs base URL from environment or default.
 */
function getDocsBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: check the env var injected by Next.js
    return process.env.NEXT_PUBLIC_DOCUMENTATION_URL || DEFAULT_DOCS_BASE
  }
  return process.env.NEXT_PUBLIC_DOCUMENTATION_URL || DEFAULT_DOCS_BASE
}

/**
 * Convert a block registry type key to a docs URL slug.
 * e.g. "google_sheets" → "google-sheets", "twilio_sms" → "twilio"
 */
function blockTypeToSlug(blockType: string): string {
  if (BLOCK_TYPE_TO_DOC_SLUG[blockType]) {
    return BLOCK_TYPE_TO_DOC_SLUG[blockType]
  }
  return blockType.replace(/_/g, '-')
}

/**
 * Get the full documentation URL for a block.
 * Returns null if the block has no documentation page.
 *
 * @param blockType - The block registry key (e.g. "agent", "google_sheets")
 * @param category - The block category ("blocks" | "tools" | "triggers")
 */
export function getBlockDocsUrl(blockType: string, category: BlockCategory): string | null {
  if (BLOCKS_WITHOUT_DOCS.has(blockType)) {
    return null
  }

  const base = getDocsBaseUrl()
  const slug = blockTypeToSlug(blockType)

  return `${base}/docs/${category}/${slug}`
}

/**
 * Get the root documentation URL.
 */
export function getDocsUrl(): string {
  return `${getDocsBaseUrl()}/docs`
}
