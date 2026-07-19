/**
 * Linear connector (new paginated + deferred contract).
 *
 * Syncs Linear issues into the knowledge base. Uses the new list/get contract so the runner
 * paginates issue refs cheaply and only downloads full issue content when an issue is new or its
 * `updatedAt` changed since the last sync.
 *
 * Config: { credentialId: string, teamId?: string }
 *   - `credentialId` is the id of the user's stored Linear OAuth credential (account row).
 *   - `teamId` optionally scopes the sync to a single Linear team.
 *
 * Auth: reuses Zelaxy's existing Linear OAuth. The token is resolved with
 * `refreshAccessTokenIfNeeded(credentialId, connector.createdBy, requestId)`; `createdBy` (the user
 * who owns the credential) is supplied by the sync runner via the list/get context.
 */

import { createLogger } from '@/lib/logs/console/logger'
import { refreshAccessTokenIfNeeded } from '@/app/api/auth/oauth/utils'
import type {
  ConnectorDefinition,
  ConnectorDocumentRef,
  GetDocumentContext,
  ListDocumentsContext,
  ListDocumentsResult,
  ResolvedDocument,
} from './types'

const logger = createLogger('LinearConnector')

const LINEAR_GRAPHQL = 'https://api.linear.app/graphql'
const PAGE_SIZE = 50

interface LinearIssueNode {
  id: string
  identifier?: string
  title?: string
  description?: string | null
  url?: string
  updatedAt?: string
}

/**
 * Resolve the Linear access token for a connector. Reads the credential id from config and passes
 * the connector's creator to `refreshAccessTokenIfNeeded`, refreshing an expired token if needed.
 */
async function resolveLinearToken(
  config: Record<string, any>,
  createdBy: string | null
): Promise<string> {
  const credentialId: string | undefined = config?.credentialId
  if (!credentialId) {
    throw new Error('Linear connector requires "credentialId" in config')
  }
  if (!createdBy) {
    throw new Error('Linear connector is missing an owner (createdBy) to resolve OAuth credential')
  }

  const token = await refreshAccessTokenIfNeeded(credentialId, createdBy, 'kb-connector-linear')
  if (!token) {
    throw new Error('Could not retrieve a valid Linear access token for the stored credential')
  }
  return token
}

async function linearGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, any>
): Promise<T> {
  const res = await fetch(LINEAR_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Linear API request failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Linear API error: ${json.errors.map((e) => e.message).join('; ')}`)
  }
  if (!json.data) {
    throw new Error('Linear API returned no data')
  }
  return json.data
}

const LIST_QUERY = `
  query ConnectorIssues($first: Int!, $after: String, $filter: IssueFilter) {
    issues(first: $first, after: $after, filter: $filter, orderBy: updatedAt) {
      pageInfo { hasNextPage endCursor }
      nodes { id identifier title url updatedAt }
    }
  }
`

const GET_QUERY = `
  query ConnectorIssue($id: String!) {
    issue(id: $id) {
      id
      identifier
      title
      description
      url
      updatedAt
    }
  }
`

export const linearConnector: ConnectorDefinition = {
  type: 'linear',
  displayName: 'Linear',
  requiresCredential: true,
  auth: { type: 'oauth', provider: 'linear', credentialField: 'credentialId' },

  async listDocuments(ctx: ListDocumentsContext): Promise<ListDocumentsResult> {
    const token = await resolveLinearToken(ctx.config || {}, ctx.createdBy)
    const teamId: string | undefined = ctx.config?.teamId

    const filter = teamId ? { team: { id: { eq: teamId } } } : undefined

    const data = await linearGraphql<{
      issues: {
        pageInfo: { hasNextPage: boolean; endCursor?: string | null }
        nodes: LinearIssueNode[]
      }
    }>(token, LIST_QUERY, { first: PAGE_SIZE, after: ctx.cursor ?? null, filter })

    const nodes = data.issues?.nodes ?? []
    const documents: ConnectorDocumentRef[] = nodes.map((issue) => ({
      externalId: issue.id,
      filename: `${issue.identifier ? `${issue.identifier} ` : ''}${issue.title || 'Untitled issue'}`,
      sourceUrl: issue.url,
      mimeType: 'text/plain',
      // Cheap change token: skip re-fetching an issue whose updatedAt is unchanged.
      contentHash: issue.updatedAt,
    }))

    const pageInfo = data.issues?.pageInfo
    const nextCursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null

    logger.info(`Listed ${documents.length} Linear issues${teamId ? ` for team ${teamId}` : ''}`)
    return { documents, nextCursor }
  },

  async getDocument(ctx: GetDocumentContext): Promise<ResolvedDocument> {
    const token = await resolveLinearToken(ctx.config || {}, ctx.createdBy)

    const data = await linearGraphql<{ issue: LinearIssueNode | null }>(token, GET_QUERY, {
      id: ctx.ref.externalId,
    })

    const issue = data.issue
    if (!issue) {
      throw new Error(`Linear issue ${ctx.ref.externalId} not found`)
    }

    const heading = `${issue.identifier ? `${issue.identifier}: ` : ''}${issue.title || 'Untitled issue'}`
    const body = (issue.description || '').trim()
    const content = body ? `${heading}\n\n${body}` : heading

    return {
      content,
      filename: `${issue.identifier ? `${issue.identifier} ` : ''}${issue.title || 'Untitled issue'}`,
      sourceUrl: issue.url ?? ctx.ref.sourceUrl,
      mimeType: 'text/plain',
      contentHash: issue.updatedAt ?? ctx.ref.contentHash,
    }
  },
}
