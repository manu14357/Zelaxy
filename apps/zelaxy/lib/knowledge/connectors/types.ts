/**
 * Knowledge base connector framework — types.
 *
 * A connector knows how to fetch documents from an external source. The sync runner
 * (see ./sync-runner) is source-agnostic: it diffs the source's current documents against the
 * documents already ingested for this connector, and adds/updates/removes as needed.
 *
 * There are two connector contracts, and the sync runner supports both:
 *
 *  1. Legacy (single-shot): implement `fetchDocuments`, which returns every document with its
 *     content inline in one call. Simple, but loads all content up-front and has no pagination.
 *     The 7 original connectors (github, web, notion, slack, confluence, google_drive, zendesk)
 *     use this contract and are unchanged.
 *
 *  2. New (paginated + deferred): implement `listDocuments` (a page of lightweight refs, each
 *     optionally carrying a cheap `contentHash` such as an `updatedAt`) plus `getDocument` (fetch
 *     the full content for one ref). The runner paginates through `listDocuments`, and only calls
 *     `getDocument` for refs that are new or whose `contentHash` changed — so unchanged documents
 *     are never re-downloaded. Declarative `auth` lets the runner resolve an OAuth token from the
 *     connector's stored config before invoking either method.
 *
 * A connector must implement exactly one of the two contracts. Both may declare `requiresCredential`.
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

export interface SyncSummary {
  added: number
  updated: number
  deleted: number
  failed: number
  error?: string
}

// ---------------------------------------------------------------------------
// New (paginated + deferred) contract — all optional, additive to the above.
// ---------------------------------------------------------------------------

/**
 * Declarative auth for a connector. The sync runner resolves this into a usable token/credential
 * and hands it to `listDocuments` / `getDocument` before they run.
 *
 *  - `none`   — the source is public; no credential.
 *  - `apiKey` — use the connector's stored `credential` column verbatim.
 *  - `oauth`  — resolve an access token from the OAuth credential id stored in the connector's
 *               config (field name defaults to `credentialId`), refreshing it if expired. The
 *               connector's `createdBy` user owns the credential. Connectors that resolve the
 *               token themselves (e.g. via refreshAccessTokenIfNeeded) may still declare this so
 *               the API/UI knows which OAuth provider to prompt for.
 */
export interface ConnectorAuthSpec {
  type: 'none' | 'apiKey' | 'oauth'
  /** OAuth provider id (e.g. 'linear'), for `type: 'oauth'`. */
  provider?: string
  /** Config field holding the OAuth credential id. Defaults to 'credentialId'. */
  credentialField?: string
}

/** A lightweight reference to a source document, returned by `listDocuments`. */
export interface ConnectorDocumentRef {
  /** Stable identifier of the item within the source. */
  externalId: string
  filename: string
  sourceUrl?: string
  mimeType?: string
  /**
   * Cheap change token (e.g. an `updatedAt` timestamp or an ETag). When present and unchanged
   * from the last sync, the runner skips `getDocument` for this ref entirely. When absent, the
   * runner always calls `getDocument` and hashes the returned content instead.
   */
  contentHash?: string
}

/** Auth resolved by the runner and passed to the new-style connector methods. */
export interface ResolvedConnectorAuth {
  /** Access token (OAuth) or api key, whichever applies. Null when unauthenticated. */
  token?: string | null
}

export interface ListDocumentsContext {
  config: Record<string, any>
  /** Legacy api-key credential, if any. */
  credential?: string | null
  /** The user that created the connector — owner of any OAuth credential. */
  createdBy: string | null
  /** Auth resolved by the runner from the declarative `auth` spec. */
  auth: ResolvedConnectorAuth
  /** Opaque pagination cursor from the previous page; undefined for the first page. */
  cursor?: string
}

export interface ListDocumentsResult {
  documents: ConnectorDocumentRef[]
  /** Opaque cursor for the next page. Falsy = no more pages. */
  nextCursor?: string | null
}

export interface GetDocumentContext {
  config: Record<string, any>
  credential?: string | null
  createdBy: string | null
  auth: ResolvedConnectorAuth
  ref: ConnectorDocumentRef
}

/** Full content for one document, returned by `getDocument`. */
export interface ResolvedDocument {
  /** Plain-text content to be chunked & embedded. */
  content: string
  /** Overrides for the ref's metadata, if the full fetch knows better. */
  filename?: string
  sourceUrl?: string
  mimeType?: string
  /** Overrides the ref's contentHash (e.g. hash the body rather than trust updatedAt). */
  contentHash?: string
}

export interface ConnectorDefinition {
  type: string
  displayName: string
  /** Whether a credential (API key / token) is required. */
  requiresCredential: boolean

  // Legacy single-shot contract. Optional so new-style connectors can omit it.
  /** Fetch the current set of documents (with content) from the source. Throws on hard failure. */
  fetchDocuments?: (ctx: ConnectorContext) => Promise<FetchedDocument[]>

  // New paginated + deferred contract. Implement `listDocuments` + `getDocument` together.
  /** Declarative auth resolved by the runner before list/get run. Defaults to `apiKey` semantics. */
  auth?: ConnectorAuthSpec
  /** Return one page of document refs. Throws on hard failure. */
  listDocuments?: (ctx: ListDocumentsContext) => Promise<ListDocumentsResult>
  /** Fetch the full content for one ref. Throws on hard failure. */
  getDocument?: (ctx: GetDocumentContext) => Promise<ResolvedDocument>
}

/** True when a connector uses the new paginated + deferred contract. */
export function isPaginatedConnector(def: ConnectorDefinition): boolean {
  return typeof def.listDocuments === 'function' && typeof def.getDocument === 'function'
}

export const FREQUENCY_MS: Record<Exclude<ConnectorFrequency, 'manual'>, number> = {
  hourly: 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
}
