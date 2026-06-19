/**
 * Workspace Files store helpers.
 *
 * The persistent, workspace-scoped Files store described in the docs. Files written here are
 * visible to every workflow in the workspace and survive across runs (unlike execution files,
 * which expire). Bytes go to the storage provider; a `workspace_file` row catalogs each one.
 */

import { randomUUID } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { downloadFile, getPresignedUrl, isUsingCloudStorage, uploadFile } from '@/lib/uploads'
import { db } from '@/db'
import { workspaceFile } from '@/db/schema'

const logger = createLogger('WorkspaceFiles')

export type FileCategory = 'document' | 'image' | 'audio' | 'video' | 'code' | 'other'

export interface WorkspaceFileResult {
  id: string
  name: string
  size: number
  type: string
  url: string
  key: string
  category: FileCategory
}

const EXT_CONTENT_TYPES: Record<string, string> = {
  md: 'text/markdown',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  html: 'text/html',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
}

const CODE_EXTS = new Set([
  'js',
  'ts',
  'tsx',
  'jsx',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'c',
  'cpp',
  'cs',
  'sh',
  'json',
  'yaml',
  'yml',
  'html',
  'css',
  'sql',
  'md',
])

export function contentTypeForName(name: string, fallback = 'application/octet-stream'): string {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  return EXT_CONTENT_TYPES[ext] || fallback
}

export function categorize(mimeType: string, name: string): FileCategory {
  const m = (mimeType || '').toLowerCase()
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  if (m.startsWith('image/')) return 'image'
  if (m.startsWith('audio/')) return 'audio'
  if (m.startsWith('video/')) return 'video'
  if (CODE_EXTS.has(ext)) return 'code'
  if (
    m.includes('pdf') ||
    m.includes('word') ||
    m.includes('document') ||
    m.includes('spreadsheet') ||
    m.includes('presentation') ||
    m.startsWith('text/')
  ) {
    return 'document'
  }
  return 'other'
}

async function buildUrl(key: string): Promise<string> {
  if (isUsingCloudStorage()) {
    try {
      return await getPresignedUrl(key, 24 * 60 * 60)
    } catch (e) {
      logger.warn('Failed to presign workspace file URL; falling back to serve path', { e })
    }
  }
  return `/api/files/serve/${key}`
}

/** Resolve a name collision by appending " (n)" before the extension, like the docs describe. */
async function dedupeName(workspaceId: string, name: string): Promise<string> {
  const existing = await db
    .select({ name: workspaceFile.name })
    .from(workspaceFile)
    .where(eq(workspaceFile.workspaceId, workspaceId))
  const taken = new Set(existing.map((r) => r.name.toLowerCase()))
  if (!taken.has(name.toLowerCase())) return name

  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let n = 1
  while (taken.has(`${base} (${n})${ext}`.toLowerCase())) n++
  return `${base} (${n})${ext}`
}

/** Create a new workspace file from text/buffer content. */
export async function writeWorkspaceFile(input: {
  workspaceId: string
  userId?: string | null
  name: string
  content: string | Buffer
  contentType?: string
}): Promise<WorkspaceFileResult> {
  const finalName = await dedupeName(input.workspaceId, input.name)
  const buffer = Buffer.isBuffer(input.content) ? input.content : Buffer.from(input.content, 'utf8')
  const type = input.contentType || contentTypeForName(finalName, 'text/plain')

  const uploaded = await uploadFile(buffer, finalName, type, buffer.length)
  const id = randomUUID()
  const category = categorize(type, finalName)

  await db.insert(workspaceFile).values({
    id,
    workspaceId: input.workspaceId,
    name: finalName,
    key: uploaded.key,
    size: buffer.length,
    type,
    category,
    uploadedBy: input.userId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  logger.info(
    `Wrote workspace file "${finalName}" (${buffer.length} bytes) to ${input.workspaceId}`
  )
  return {
    id,
    name: finalName,
    size: buffer.length,
    type,
    url: await buildUrl(uploaded.key),
    key: uploaded.key,
    category,
  }
}

/** Append content to the end of an existing workspace file (by name). Creates it if absent. */
export async function appendWorkspaceFile(input: {
  workspaceId: string
  userId?: string | null
  name: string
  content: string
}): Promise<WorkspaceFileResult> {
  const [existing] = await db
    .select()
    .from(workspaceFile)
    .where(
      and(eq(workspaceFile.workspaceId, input.workspaceId), eq(workspaceFile.name, input.name))
    )
    .orderBy(desc(workspaceFile.createdAt))
    .limit(1)

  if (!existing) {
    // Nothing to append to → create it.
    return writeWorkspaceFile({ ...input })
  }

  let prior = ''
  try {
    prior = (await downloadFile(existing.key)).toString('utf8')
  } catch (e) {
    logger.warn(`Append: could not read existing "${input.name}"; starting fresh`, { e })
  }
  const merged = Buffer.from(`${prior}${input.content}`, 'utf8')
  // Re-upload (new key) and repoint the catalog row.
  const uploaded = await uploadFile(merged, existing.name, existing.type, merged.length)

  await db
    .update(workspaceFile)
    .set({ key: uploaded.key, size: merged.length, updatedAt: new Date() })
    .where(eq(workspaceFile.id, existing.id))

  return {
    id: existing.id,
    name: existing.name,
    size: merged.length,
    type: existing.type,
    url: await buildUrl(uploaded.key),
    key: uploaded.key,
    category: existing.category as FileCategory,
  }
}

export async function listWorkspaceFiles(workspaceId: string) {
  const rows = await db
    .select()
    .from(workspaceFile)
    .where(eq(workspaceFile.workspaceId, workspaceId))
    .orderBy(desc(workspaceFile.createdAt))
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      name: r.name,
      size: r.size,
      type: r.type,
      category: r.category,
      folder: r.folder,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      url: await buildUrl(r.key),
    }))
  )
}
