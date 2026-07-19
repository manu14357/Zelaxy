/**
 * Connector sync runner.
 *
 * Source-agnostic: loads a connector, gathers the source's current documents, diffs the result
 * against the documents already ingested for this connector (by externalId + contentHash), and adds
 * / updates / removes. Ingestion reuses the standard document pipeline (`processDocumentAsync`) by
 * handing it the fetched text as a base64 data URI, so chunking + embedding behave exactly like an
 * upload.
 *
 * Two connector contracts are supported (see ./types):
 *   - Legacy: `fetchDocuments` returns every document with content inline. Run as a single page.
 *   - New:    `listDocuments` (paginated refs) + `getDocument` (deferred content fetch). The runner
 *             paginates the refs and only calls `getDocument` when a ref is new or its cheap
 *             `contentHash` changed — unchanged documents are never re-downloaded.
 */

import { randomUUID } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { processDocumentAsync } from '@/app/api/knowledge/utils'
import { db } from '@/db'
import { document, embedding, knowledgeBase, knowledgeBaseConnector } from '@/db/schema'
import { getConnector } from './registry'
import {
  type ConnectorDefinition,
  type ConnectorFrequency,
  FREQUENCY_MS,
  isPaginatedConnector,
  type ResolvedConnectorAuth,
  type SyncSummary,
} from './types'
import { collectAllDocumentRefs, hashContent } from './utils'

const logger = createLogger('ConnectorSync')

function computeNextSync(frequency: string): Date | null {
  if (frequency === 'manual' || !(frequency in FREQUENCY_MS)) return null
  return new Date(Date.now() + FREQUENCY_MS[frequency as Exclude<ConnectorFrequency, 'manual'>])
}

/**
 * Resolve declarative auth into a token the runner passes to new-style connectors. `apiKey` (the
 * default) uses the stored credential; `none` is unauthenticated; `oauth` connectors resolve their
 * own token from `createdBy` + config, so the runner passes a null token but still supplies those.
 */
function resolveAuth(def: ConnectorDefinition, credential: string | null): ResolvedConnectorAuth {
  const spec = def.auth
  if (!spec || spec.type === 'apiKey') return { token: credential }
  return { token: null }
}

type PriorDoc = { id: string; externalId: string | null; contentHash: string | null }

interface IngestPlan {
  filename: string
  content: string
  sourceUrl?: string
  mimeType: string
  hash: string
}

/**
 * A candidate document discovered from the source. `refHash` is a cheap change token (may be
 * undefined). `loadContent` lazily produces the full body — only invoked when the candidate is new
 * or its refHash changed.
 */
interface Candidate {
  externalId: string
  filename: string
  sourceUrl?: string
  mimeType?: string
  refHash?: string
  loadContent: () => Promise<{
    content: string
    filename?: string
    sourceUrl?: string
    mimeType?: string
    contentHash?: string
  }>
}

/**
 * Run one sync for a connector. Never throws — failures are recorded on the connector row.
 * Returns the sync summary.
 */
export async function runConnectorSync(connectorId: string): Promise<SyncSummary> {
  const summary: SyncSummary = { added: 0, updated: 0, deleted: 0, failed: 0 }

  const [connector] = await db
    .select()
    .from(knowledgeBaseConnector)
    .where(eq(knowledgeBaseConnector.id, connectorId))
    .limit(1)

  if (!connector) {
    return { ...summary, error: 'Connector not found' }
  }

  const definition = getConnector(connector.type)
  if (!definition) {
    return { ...summary, error: `Unknown connector type: ${connector.type}` }
  }

  const [kb] = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.id, connector.knowledgeBaseId))
    .limit(1)
  if (!kb) return { ...summary, error: 'Knowledge base not found' }

  // Mark syncing.
  await db
    .update(knowledgeBaseConnector)
    .set({ status: 'syncing', updatedAt: new Date() })
    .where(eq(knowledgeBaseConnector.id, connectorId))

  try {
    const config = (connector.config as Record<string, any>) || {}
    const createdBy = connector.createdBy ?? null
    const credential = connector.credential ?? null

    // Existing connector-owned documents (not soft-deleted).
    const existing: PriorDoc[] = await db
      .select({
        id: document.id,
        externalId: document.externalId,
        contentHash: document.contentHash,
      })
      .from(document)
      .where(and(eq(document.connectorId, connectorId), isNull(document.deletedAt)))

    const existingByExternal = new Map(existing.map((d) => [d.externalId, d]))
    const seenExternal = new Set<string>()

    const chunkCfg = (kb.chunkingConfig as any) || {}
    const processingOptions = {
      chunkSize: chunkCfg.maxSize || 1024,
      chunkOverlap: chunkCfg.overlap ?? 200,
      minCharactersPerChunk: chunkCfg.minSize || 1,
      recipe: 'default',
      lang: 'en',
      strategy: (chunkCfg.strategy as any) || 'auto',
      embeddingModel: kb.embeddingModel,
    }

    // Build the candidate list from whichever contract the connector implements.
    let candidates: Candidate[]

    if (isPaginatedConnector(definition)) {
      const auth = resolveAuth(definition, credential)
      const refs = await collectAllDocumentRefs(definition.listDocuments!, {
        config,
        credential,
        createdBy,
        auth,
      })
      logger.info(`[${connectorId}] Listed ${refs.length} refs from ${connector.type}`)

      candidates = refs.map((ref) => ({
        externalId: ref.externalId,
        filename: ref.filename,
        sourceUrl: ref.sourceUrl,
        mimeType: ref.mimeType,
        refHash: ref.contentHash,
        loadContent: async () => {
          const resolved = await definition.getDocument!({
            config,
            credential,
            createdBy,
            auth,
            ref,
          })
          return resolved
        },
      }))
    } else if (typeof definition.fetchDocuments === 'function') {
      const fetched = await definition.fetchDocuments({ config, credential })
      logger.info(`[${connectorId}] Fetched ${fetched.length} items from ${connector.type}`)
      // Legacy: content is already in hand; wrap each as a candidate with no cheap refHash.
      candidates = fetched.map((item) => ({
        externalId: item.externalId,
        filename: item.filename,
        sourceUrl: item.sourceUrl,
        mimeType: item.mimeType,
        loadContent: async () => ({
          content: item.content,
          filename: item.filename,
          sourceUrl: item.sourceUrl,
          mimeType: item.mimeType,
        }),
      }))
    } else {
      throw new Error(`Connector "${connector.type}" implements neither contract`)
    }

    for (const candidate of candidates) {
      seenExternal.add(candidate.externalId)
      const prior = existingByExternal.get(candidate.externalId)

      // Deferred skip: a cheap refHash that matches the stored hash means unchanged — no fetch.
      if (prior && candidate.refHash && prior.contentHash === candidate.refHash) {
        continue
      }

      try {
        const resolved = await candidate.loadContent()
        const content = resolved.content
        const hash = resolved.contentHash ?? candidate.refHash ?? hashContent(content)

        // Unchanged (covers legacy connectors, which have no cheap refHash).
        if (prior && prior.contentHash === hash) continue

        const plan: IngestPlan = {
          filename: resolved.filename ?? candidate.filename,
          content,
          sourceUrl: resolved.sourceUrl ?? candidate.sourceUrl,
          mimeType: resolved.mimeType ?? candidate.mimeType ?? 'text/plain',
          hash,
        }
        const fileUrl = `data:text/plain;base64,${Buffer.from(plan.content, 'utf8').toString('base64')}`
        const fileSize = Buffer.byteLength(plan.content, 'utf8')

        if (!prior) {
          // New document.
          const documentId = randomUUID()
          await db.insert(document).values({
            id: documentId,
            knowledgeBaseId: connector.knowledgeBaseId,
            filename: plan.filename,
            fileUrl,
            fileSize,
            mimeType: plan.mimeType,
            processingStatus: 'pending',
            enabled: true,
            uploadedAt: new Date(),
            connectorId,
            externalId: candidate.externalId,
            contentHash: plan.hash,
          })
          await processDocumentAsync(
            connector.knowledgeBaseId,
            documentId,
            { filename: plan.filename, fileUrl, fileSize, mimeType: plan.mimeType },
            processingOptions
          )
          summary.added++
        } else {
          // Changed: clear old chunks, reset the row, reprocess.
          await db.delete(embedding).where(eq(embedding.documentId, prior.id))
          await db
            .update(document)
            .set({
              filename: plan.filename,
              fileUrl,
              fileSize,
              contentHash: plan.hash,
              chunkCount: 0,
              tokenCount: 0,
              characterCount: 0,
              processingStatus: 'pending',
              processingError: null,
            })
            .where(eq(document.id, prior.id))
          await processDocumentAsync(
            connector.knowledgeBaseId,
            prior.id,
            { filename: plan.filename, fileUrl, fileSize, mimeType: plan.mimeType },
            processingOptions
          )
          summary.updated++
        }
      } catch (itemError) {
        summary.failed++
        logger.warn(`[${connectorId}] Failed to ingest ${candidate.externalId}`, { itemError })
      }
    }

    // Removed at source → delete chunks + document row.
    for (const prior of existing) {
      if (prior.externalId && !seenExternal.has(prior.externalId)) {
        await db.delete(embedding).where(eq(embedding.documentId, prior.id))
        await db.delete(document).where(eq(document.id, prior.id))
        summary.deleted++
      }
    }

    await db
      .update(knowledgeBaseConnector)
      .set({
        status: 'active',
        lastSyncAt: new Date(),
        nextSyncAt: computeNextSync(connector.frequency),
        lastSyncSummary: summary,
        failedCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeBaseConnector.id, connectorId))

    logger.info(`[${connectorId}] Sync complete`, summary)
    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    const failedCount = (connector.failedCount || 0) + 1
    // Disable after 10 consecutive full-sync failures, per the spec.
    await db
      .update(knowledgeBaseConnector)
      .set({
        status: failedCount >= 10 ? 'disabled' : 'error',
        failedCount,
        lastSyncSummary: { ...summary, error: message },
        nextSyncAt: computeNextSync(connector.frequency),
        updatedAt: new Date(),
      })
      .where(eq(knowledgeBaseConnector.id, connectorId))
    logger.error(`[${connectorId}] Sync failed: ${message}`)
    return { ...summary, error: message }
  }
}
