/**
 * Google Drive connector. Syncs Google Docs into the knowledge base.
 *
 * Config: { folderId? }
 * Credential: a Google OAuth access token (used as Bearer).
 */

import { createLogger } from '@/lib/logs/console/logger'
import type { ConnectorContext, ConnectorDefinition, FetchedDocument } from './types'

const logger = createLogger('GoogleDriveConnector')

const MAX_DOCS = 500

export const googleDriveConnector: ConnectorDefinition = {
  type: 'google_drive',
  displayName: 'Google Drive',
  requiresCredential: true,

  async fetchDocuments(ctx: ConnectorContext): Promise<FetchedDocument[]> {
    const token = ctx.credential
    if (!token) {
      throw new Error('Google Drive connector requires a credential (OAuth access token)')
    }
    const { folderId } = ctx.config || {}

    // 1. List Google Docs (optionally scoped to a folder).
    const folderClause = folderId ? `'${folderId}' in parents and ` : ''
    const q = `${folderClause}mimeType='application/vnd.google-apps.document'`
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent('files(id,name)')}&pageSize=100`
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!listRes.ok) {
      const text = await listRes.text().catch(() => '')
      throw new Error(`Google Drive list failed (${listRes.status}): ${text.slice(0, 200)}`)
    }
    const data = (await listRes.json()) as { files?: Array<{ id?: string; name?: string }> }
    const files = (data.files || []).slice(0, MAX_DOCS)

    logger.info(`Fetching ${files.length} Google Docs`)

    // 2. Export each doc as plain text.
    const docs: FetchedDocument[] = []
    for (const file of files) {
      const id = file?.id
      if (!id) continue
      try {
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/plain`
        const res = await fetch(exportUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          logger.warn(`Skipping doc ${id}: export ${res.status}`)
          continue
        }
        const content = await res.text()
        if (!content.trim()) continue
        docs.push({
          externalId: id,
          filename: file.name || id,
          content,
          sourceUrl: `https://docs.google.com/document/d/${id}`,
          mimeType: 'text/plain',
        })
      } catch (e) {
        logger.warn(`Skipping doc ${id}: ${e instanceof Error ? e.message : 'fetch error'}`)
      }
    }
    return docs
  },
}
