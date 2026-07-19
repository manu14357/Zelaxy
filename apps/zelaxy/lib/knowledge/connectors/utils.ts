/**
 * Connector framework helpers shared by the sync runner and the new-style (paginated) connectors:
 * content hashing and safe pagination.
 */

import { createHash } from 'node:crypto'
import type { ConnectorDocumentRef, ListDocumentsContext, ListDocumentsResult } from './types'

/** SHA-256 hex hash of a string, used to detect content changes between syncs. */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

/** Hard cap on how many pages we will walk in a single sync, to bound runaway pagination. */
export const DEFAULT_MAX_PAGES = 200

/** Hard cap on how many refs we will collect in a single sync. */
export const DEFAULT_MAX_DOCUMENTS = 10_000

export interface CollectPagesOptions {
  maxPages?: number
  maxDocuments?: number
}

/**
 * Walk a connector's `listDocuments` from the first page to the last, following its `nextCursor`,
 * and return every ref. Guards against infinite pagination via `maxPages`, a repeated cursor, and
 * a total-document cap. `listFn` is called once per page with the running cursor.
 */
export async function collectAllDocumentRefs(
  listFn: (ctx: ListDocumentsContext) => Promise<ListDocumentsResult>,
  baseCtx: Omit<ListDocumentsContext, 'cursor'>,
  options: CollectPagesOptions = {}
): Promise<ConnectorDocumentRef[]> {
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES
  const maxDocuments = options.maxDocuments ?? DEFAULT_MAX_DOCUMENTS

  const all: ConnectorDocumentRef[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  for (let page = 0; page < maxPages; page++) {
    const result = await listFn({ ...baseCtx, cursor })
    const docs = result?.documents ?? []
    for (const doc of docs) {
      all.push(doc)
      if (all.length >= maxDocuments) return all
    }

    const next = result?.nextCursor
    if (!next) break
    // Defend against a connector that keeps returning the same cursor forever.
    if (seenCursors.has(next)) break
    seenCursors.add(next)
    cursor = next
  }

  return all
}
