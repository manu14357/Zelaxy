/**
 * Connector sync runner.
 *
 * Source-agnostic: loads a connector, calls its `fetchDocuments`, diffs the result against the
 * documents already ingested for this connector (by externalId + contentHash), and adds / updates
 * / removes. Ingestion reuses the standard document pipeline (`processDocumentAsync`) by handing it
 * the fetched text as a base64 data URI, so chunking + embedding behave exactly like an upload.
 */

import { createHash, randomUUID } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { processDocumentAsync } from '@/app/api/knowledge/utils'
import { db } from '@/db'
import { document, embedding, knowledgeBase, knowledgeBaseConnector } from '@/db/schema'
import { getConnector } from './registry'
import { type ConnectorFrequency, FREQUENCY_MS, type SyncSummary } from './types'

const logger = createLogger('ConnectorSync')

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function computeNextSync(frequency: string): Date | null {
  if (frequency === 'manual' || !(frequency in FREQUENCY_MS)) return null
  return new Date(Date.now() + FREQUENCY_MS[frequency as Exclude<ConnectorFrequency, 'manual'>])
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
    const fetched = await definition.fetchDocuments({
      config: (connector.config as Record<string, any>) || {},
      credential: connector.credential,
    })
    logger.info(`[${connectorId}] Fetched ${fetched.length} items from ${connector.type}`)

    // Existing connector-owned documents (not soft-deleted).
    const existing = await db
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

    for (const item of fetched) {
      seenExternal.add(item.externalId)
      const hash = hashContent(item.content)
      const prior = existingByExternal.get(item.externalId)
      const fileUrl = `data:text/plain;base64,${Buffer.from(item.content, 'utf8').toString('base64')}`
      const fileSize = Buffer.byteLength(item.content, 'utf8')

      try {
        if (!prior) {
          // New document.
          const documentId = randomUUID()
          await db.insert(document).values({
            id: documentId,
            knowledgeBaseId: connector.knowledgeBaseId,
            filename: item.filename,
            fileUrl,
            fileSize,
            mimeType: item.mimeType || 'text/plain',
            processingStatus: 'pending',
            enabled: true,
            uploadedAt: new Date(),
            connectorId,
            externalId: item.externalId,
            contentHash: hash,
          })
          await processDocumentAsync(
            connector.knowledgeBaseId,
            documentId,
            { filename: item.filename, fileUrl, fileSize, mimeType: item.mimeType || 'text/plain' },
            processingOptions
          )
          summary.added++
        } else if (prior.contentHash !== hash) {
          // Changed: clear old chunks, reset the row, reprocess.
          await db.delete(embedding).where(eq(embedding.documentId, prior.id))
          await db
            .update(document)
            .set({
              filename: item.filename,
              fileUrl,
              fileSize,
              contentHash: hash,
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
            { filename: item.filename, fileUrl, fileSize, mimeType: item.mimeType || 'text/plain' },
            processingOptions
          )
          summary.updated++
        }
        // else unchanged → skip
      } catch (itemError) {
        summary.failed++
        logger.warn(`[${connectorId}] Failed to ingest ${item.externalId}`, { itemError })
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
