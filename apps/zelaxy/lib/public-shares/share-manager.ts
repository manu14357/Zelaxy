/**
 * Public file share CRUD.
 *
 * A public share is a token-addressable grant that exposes exactly one workspace_file to
 * unauthenticated visitors through a gate (public | password | email | sso). This module owns
 * row creation/lookup/revocation and password hashing; the gate logic lives in ./share-auth.
 */

import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { and, desc, eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { publicShare, workspaceFile } from '@/db/schema'

const logger = createLogger('PublicShareManager')

const scryptAsync = promisify(scrypt)

export type PublicShareMode = 'public' | 'password' | 'email' | 'sso'

export interface PublicShareRow {
  id: string
  token: string
  workspaceId: string
  fileId: string
  mode: PublicShareMode
  passwordHash: string | null
  allowedEmails: string[] | null
  expiresAt: Date | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

/** URL-safe, high-entropy share token (32 bytes → 43 base64url chars). */
export function generateShareToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Hash a share password with a per-share salt (scrypt). Stored as "salt:hash" (hex). */
export async function hashSharePassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

/** Constant-time verify against a stored "salt:hash" value. */
export async function verifySharePassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  const keyBuffer = Buffer.from(key, 'hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return keyBuffer.length === derived.length && timingSafeEqual(keyBuffer, derived)
}

export interface CreateShareInput {
  workspaceId: string
  fileId: string
  mode: PublicShareMode
  createdBy?: string | null
  password?: string | null
  allowedEmails?: string[] | null
  expiresAt?: Date | null
}

/**
 * Create (or replace) the public share for a file. A file has at most one active share, so an
 * existing share for the same file is updated in place (its token is preserved).
 */
export async function createPublicShare(input: CreateShareInput): Promise<PublicShareRow> {
  if (input.mode === 'password' && !input.password) {
    throw new Error('A password is required for password-gated shares')
  }
  if (input.mode === 'email' && (!input.allowedEmails || input.allowedEmails.length === 0)) {
    throw new Error('At least one allowed email is required for email-gated shares')
  }

  const passwordHash =
    input.mode === 'password' && input.password ? await hashSharePassword(input.password) : null
  const allowedEmails =
    input.mode === 'email' || input.mode === 'sso' ? (input.allowedEmails ?? null) : null

  const existing = await getShareForFile(input.workspaceId, input.fileId)
  const now = new Date()

  if (existing) {
    const [updated] = await db
      .update(publicShare)
      .set({
        mode: input.mode,
        passwordHash,
        allowedEmails,
        expiresAt: input.expiresAt ?? null,
        updatedAt: now,
      })
      .where(eq(publicShare.id, existing.id))
      .returning()
    logger.info(`Updated public share ${existing.id} for file ${input.fileId} (mode=${input.mode})`)
    return updated as PublicShareRow
  }

  const [row] = await db
    .insert(publicShare)
    .values({
      id: randomUUID(),
      token: generateShareToken(),
      workspaceId: input.workspaceId,
      fileId: input.fileId,
      mode: input.mode,
      passwordHash,
      allowedEmails,
      expiresAt: input.expiresAt ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  logger.info(`Created public share ${row.id} for file ${input.fileId} (mode=${input.mode})`)
  return row as PublicShareRow
}

/** Look up a share by its public token. */
export async function getShareByToken(token: string): Promise<PublicShareRow | null> {
  const [row] = await db.select().from(publicShare).where(eq(publicShare.token, token)).limit(1)
  return (row as PublicShareRow) ?? null
}

/** The (single) active share for a file within a workspace, if any. */
export async function getShareForFile(
  workspaceId: string,
  fileId: string
): Promise<PublicShareRow | null> {
  const [row] = await db
    .select()
    .from(publicShare)
    .where(and(eq(publicShare.workspaceId, workspaceId), eq(publicShare.fileId, fileId)))
    .orderBy(desc(publicShare.createdAt))
    .limit(1)
  return (row as PublicShareRow) ?? null
}

/** Revoke a file's share. Returns true when a row was deleted. */
export async function revokePublicShare(workspaceId: string, fileId: string): Promise<boolean> {
  const deleted = await db
    .delete(publicShare)
    .where(and(eq(publicShare.workspaceId, workspaceId), eq(publicShare.fileId, fileId)))
    .returning({ id: publicShare.id })
  if (deleted.length > 0) {
    logger.info(`Revoked public share for file ${fileId} in workspace ${workspaceId}`)
  }
  return deleted.length > 0
}

/** True when a share exists and its expiry (if any) has passed. */
export function isShareExpired(share: Pick<PublicShareRow, 'expiresAt'>): boolean {
  return !!share.expiresAt && share.expiresAt.getTime() <= Date.now()
}

/** Resolve the catalog row for a share's file (key/name/type/size for streaming). */
export async function getShareFile(fileId: string) {
  const [row] = await db.select().from(workspaceFile).where(eq(workspaceFile.id, fileId)).limit(1)
  return row ?? null
}
