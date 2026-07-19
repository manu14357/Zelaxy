import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { arenaChat } from '@/db/schema'

export const dynamic = 'force-dynamic'

// Persisted messages have no stable id, so a fork is addressed by array index. `messageIndex` is the
// index of the LAST message to keep (inclusive) — the new chat gets messages[0..messageIndex]. Omit
// it to copy the whole conversation.
const ForkSchema = z.object({
  messageIndex: z.number().int().nonnegative().optional(),
})

// POST /api/zelaxy-arena/chats/[chatId]/fork — branch a conversation into a new chat row for the same
// workspace/user, keeping messages up to (and including) messageIndex. Because messages/artifacts/
// consoleEntries are inline JSONB, forking is a row copy with a truncated messages array.
export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params

  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  // Load the source, scoped to the owner (same pattern as the sibling GET/PUT/DELETE route).
  const [source] = await db
    .select()
    .from(arenaChat)
    .where(and(eq(arenaChat.id, chatId), eq(arenaChat.userId, userId)))
    .limit(1)
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Still require workspace access (matches the POST /chats create path).
  const permission = await getUserEntityPermissions(userId, 'workspace', source.workspaceId)
  if (permission === null) {
    return NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 })
  }

  let body: z.infer<typeof ForkSchema>
  try {
    body = ForkSchema.parse(await req.json().catch(() => ({})))
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const allMessages = Array.isArray(source.messages) ? (source.messages as unknown[]) : []
  const keep =
    body.messageIndex === undefined
      ? allMessages.length
      : Math.min(body.messageIndex + 1, allMessages.length)
  const messages = allMessages.slice(0, keep)

  const id = randomUUID()
  const now = new Date()
  const baseTitle = (source.title || 'New chat').trim()
  const title = `${baseTitle.slice(0, 72)} (fork)`.slice(0, 80)

  await db.insert(arenaChat).values({
    id,
    workspaceId: source.workspaceId,
    userId,
    title,
    messages,
    // Carry the live-session panel + console entries so the fork opens with the same resources.
    artifacts: Array.isArray(source.artifacts) ? source.artifacts : [],
    consoleEntries: Array.isArray(source.consoleEntries) ? source.consoleEntries : [],
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ id, title }, { status: 201 })
}
