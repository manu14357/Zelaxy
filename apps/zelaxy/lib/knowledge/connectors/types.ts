/**
 * Knowledge base connector framework — types.
 *
 * A connector knows how to fetch a list of documents from an external source. The sync runner
 * (see ./sync-runner) is source-agnostic: it calls `fetchDocuments`, diffs the returned items
 * against the documents already ingested for this connector, and adds/updates/removes as needed.
 */

export type ConnectorFrequency = 'hourly' | '6h' | 'daily' | 'weekly' | 'manual'

export interface FetchedDocument {
  /** Stable identifier of the item within the source (e.g. a file path or URL). */
  externalId: string
  filename: string
  /** Plain-text content to be chunked & embedded. */
  content: string
  /** Link back to the original, surfaced as sourceUrl on chunks. */
  sourceUrl?: string
  mimeType?: string
}

export interface ConnectorContext {
  config: Record<string, any>
  /** API key / token, if the source requires one. */
  credential?: string | null
}

export interface ConnectorDefinition {
  type: string
  displayName: string
  /** Whether a credential (API key / token) is required. */
  requiresCredential: boolean
  /** Fetch the current set of documents from the source. Should throw on hard failure. */
  fetchDocuments: (ctx: ConnectorContext) => Promise<FetchedDocument[]>
}

export interface SyncSummary {
  added: number
  updated: number
  deleted: number
  failed: number
  error?: string
}

export const FREQUENCY_MS: Record<Exclude<ConnectorFrequency, 'manual'>, number> = {
  hourly: 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
}
