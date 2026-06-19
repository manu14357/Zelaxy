/**
 * GitHub connector. Syncs files from a repository branch into the knowledge base.
 *
 * Config: { owner, repo, branch?, extensions?: string[], path?: string }
 * Credential: a GitHub personal access token (optional for public repos, but recommended to
 * avoid the low unauthenticated rate limit).
 */

import { createLogger } from '@/lib/logs/console/logger'
import type { ConnectorContext, ConnectorDefinition, FetchedDocument } from './types'

const logger = createLogger('GitHubConnector')

const DEFAULT_EXTENSIONS = ['md', 'mdx', 'txt', 'rst', 'json', 'yaml', 'yml']
const MAX_FILES = 500
const MAX_FILE_BYTES = 1_000_000 // 1MB per file

function ghHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Zelaxy-KB-Connector',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export const githubConnector: ConnectorDefinition = {
  type: 'github',
  displayName: 'GitHub',
  requiresCredential: false,

  async fetchDocuments(ctx: ConnectorContext): Promise<FetchedDocument[]> {
    const { owner, repo, branch, extensions, path } = ctx.config || {}
    if (!owner || !repo) {
      throw new Error('GitHub connector requires "owner" and "repo" in config')
    }
    const ref = branch || 'HEAD'
    const allowed: string[] =
      Array.isArray(extensions) && extensions.length > 0
        ? extensions.map((e) => String(e).replace(/^\./, '').toLowerCase())
        : DEFAULT_EXTENSIONS
    const prefix = typeof path === 'string' && path.trim() ? path.replace(/^\/+/, '') : ''

    // 1. List the tree recursively.
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`
    const treeRes = await fetch(treeUrl, { headers: ghHeaders(ctx.credential) })
    if (!treeRes.ok) {
      const text = await treeRes.text().catch(() => '')
      throw new Error(`GitHub tree fetch failed (${treeRes.status}): ${text.slice(0, 200)}`)
    }
    const tree = (await treeRes.json()) as {
      tree?: Array<{ path: string; type: string; size?: number }>
    }
    const blobs = (tree.tree || [])
      .filter((n) => n.type === 'blob')
      .filter((n) => !prefix || n.path.startsWith(prefix))
      .filter((n) => {
        const ext = n.path.includes('.') ? n.path.split('.').pop()!.toLowerCase() : ''
        return allowed.includes(ext)
      })
      .filter((n) => (n.size ?? 0) <= MAX_FILE_BYTES)
      .slice(0, MAX_FILES)

    logger.info(`Fetching ${blobs.length} files from ${owner}/${repo}@${ref}`)

    // 2. Fetch raw content for each matched file.
    const docs: FetchedDocument[] = []
    for (const blob of blobs) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${blob.path}`
      try {
        const res = await fetch(rawUrl, { headers: ghHeaders(ctx.credential) })
        if (!res.ok) {
          logger.warn(`Skipping ${blob.path}: raw fetch ${res.status}`)
          continue
        }
        const content = await res.text()
        if (!content.trim()) continue
        docs.push({
          externalId: blob.path,
          filename: blob.path.split('/').pop() || blob.path,
          content,
          sourceUrl: `https://github.com/${owner}/${repo}/blob/${ref}/${blob.path}`,
          mimeType: 'text/plain',
        })
      } catch (e) {
        logger.warn(`Skipping ${blob.path}: ${e instanceof Error ? e.message : 'fetch error'}`)
      }
    }
    return docs
  },
}
