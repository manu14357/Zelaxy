/**
 * One-time-code storage for email-gated public file shares.
 *
 * Mirrors the chat OTP flow (app/api/chat/[subdomain]/otp): a 6-digit code is stored in Redis
 * (with an in-memory fallback for local/dev) keyed by email + share id, and expires in 15 min.
 */

import { getRedisClient, markMessageAsProcessed, releaseLock } from '@/lib/redis'

// 15 minutes, matching the chat OTP expiry.
const OTP_EXPIRY = 15 * 60

function otpKey(email: string, shareId: string): string {
  return `share_otp:${email.toLowerCase()}:${shareId}`
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/** Persist an OTP for (email, share). Uses Redis when available, else the in-memory fallback. */
export async function storeShareOTP(email: string, shareId: string, otp: string): Promise<void> {
  const key = otpKey(email, shareId)
  const redis = getRedisClient()

  if (redis) {
    await redis.set(key, otp, 'EX', OTP_EXPIRY)
    return
  }

  // Fallback: mark existence, then stash the value in the same in-memory cache.
  await markMessageAsProcessed(key, OTP_EXPIRY)
  const valueKey = `${key}:value`
  try {
    const inMemoryCache = (global as any).inMemoryCache
    if (inMemoryCache) {
      const fullKey = `processed:${valueKey}`
      const expiry = Date.now() + OTP_EXPIRY * 1000
      inMemoryCache.set(fullKey, { value: otp, expiry })
    }
  } catch {
    // Best effort — a failed fallback store simply means the code won't verify.
  }
}

/** Read a stored OTP, or null when absent/expired. */
export async function getShareOTP(email: string, shareId: string): Promise<string | null> {
  const key = otpKey(email, shareId)
  const redis = getRedisClient()

  if (redis) {
    return redis.get(key)
  }

  try {
    const inMemoryCache = (global as any).inMemoryCache
    const exists = !!inMemoryCache?.get(`processed:${key}`)
    if (!exists) return null
    const cacheEntry = inMemoryCache?.get(`processed:${key}:value`)
    return cacheEntry?.value ?? null
  } catch {
    return null
  }
}

/** Remove a consumed OTP. */
export async function deleteShareOTP(email: string, shareId: string): Promise<void> {
  const key = otpKey(email, shareId)
  const redis = getRedisClient()

  if (redis) {
    await redis.del(key)
    return
  }
  await releaseLock(`processed:${key}`)
  await releaseLock(`processed:${key}:value`)
}
