import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { arenaChat } from '@/db/schema'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  title: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        tools: z.array(z.any()).optional(),
      })
    )
    .optional(),
  artifacts: z.array(z.any()).optional(),
  consoleEntries: z.array(z.any()).optional(),
})

async function getUserId() {
  const session = await getSession()
  return session?.user?.id ?? null
}

// GET — load a single conversation (with messages), scoped to the owner.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [chat] = await db
    .select()
    .from(arenaChat)
    .where(and(eq(arenaChat.id, chatId), eq(arenaChat.userId, userId)))
    .limit(1)
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ chat })
}

// PUT — save messages / rename.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof UpdateSchema>
  try {
    body = UpdateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (body.messages !== undefined) update.messages = body.messages
  if (body.artifacts !== undefined) update.artifacts = body.artifacts
  if (body.consoleEntries !== undefined) update.consoleEntries = body.consoleEntries
  if (body.title !== undefined) update.title = body.title.slice(0, 80)

  const result = await db
    .update(arenaChat)
    .set(update)
    .where(and(eq(arenaChat.id, chatId), eq(arenaChat.userId, userId)))
    .returning({ id: arenaChat.id })
  if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: chatId })
}

// DELETE — remove a conversation.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.delete(arenaChat).where(and(eq(arenaChat.id, chatId), eq(arenaChat.userId, userId)))
  return NextResponse.json({ deleted: true })
}
