import { getSession } from '@/lib/auth'
import { env } from '@/lib/env'

/**
 * Check if the current user is a platform admin.
 * Admin status is determined by the ADMIN_EMAILS env var.
 */
export async function isCurrentUserAdmin(): Promise<{
  isAdmin: boolean
  session: Awaited<ReturnType<typeof getSession>> | null
}> {
  const session = await getSession()
  if (!session?.user?.email) {
    return { isAdmin: false, session: null }
  }

  const adminEmails = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const isAdmin = adminEmails.includes(session.user.email.toLowerCase())
  return { isAdmin, session }
}
