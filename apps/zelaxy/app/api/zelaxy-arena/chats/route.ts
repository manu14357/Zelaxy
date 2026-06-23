import { randomUUID } from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { db } from '@/db'
import { arenaChat } from '@/db/schema'

export const dynamic = 'force-dynamic'

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  tools: z.array(z.any()).optional(),
  // Structured render data so history shows the SAME agent groups + interleaved narration + thinking
  // as the live turn (not just the final text). `parts` = ordered text/tool segments; `reasoning` =
  // extended-thinking content.
  parts: z.array(z.any()).optional(),
  reasoning: z.string().optional(),
})

const CreateSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().optional(),
  messages: z.array(MessageSchema).optional(),
  artifacts: z.array(z.any()).optional(),
  consoleEntries: z.array(z.any()).optional(),
})

async function authorize(workspaceId: string) {
  const session = await getSession()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
  if (permission === null) {
    return {
      error: NextResponse.json({ error: 'Not authorized for this workspace' }, { status: 403 }),
    }
  }
  return { userId: session.user.id }
}

// GET /api/zelaxy-arena/chats?workspaceId= — list the user's arena conversations (no message bodies)
export async function GET(req: NextRequest) {
  const workspaceId = new URL(req.url).searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
  const auth = await authorize(workspaceId)
  if (auth.error) return auth.error

  const rows = await db
    .select({
      id: arenaChat.id,
      title: arenaChat.title,
      createdAt: arenaChat.createdAt,
      updatedAt: arenaChat.updatedAt,
    })
    .from(arenaChat)
    .where(and(eq(arenaChat.workspaceId, workspaceId), eq(arenaChat.userId, auth.userId!)))
    .orderBy(desc(arenaChat.updatedAt))
    .limit(100)

  return NextResponse.json({ chats: rows })
}

// POST /api/zelaxy-arena/chats — create a conversation
export async function POST(req: NextRequest) {
  let body: z.infer<typeof CreateSchema>
  try {
    body = CreateSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }
  const auth = await authorize(body.workspaceId)
  if (auth.error) return auth.error

  const id = randomUUID()
  const now = new Date()
  const title = (body.title || body.messages?.[0]?.content || 'New chat').slice(0, 80)
  await db.insert(arenaChat).values({
    id,
    workspaceId: body.workspaceId,
    userId: auth.userId!,
    title,
    messages: body.messages ?? [],
    artifacts: body.artifacts ?? [],
    consoleEntries: body.consoleEntries ?? [],
    createdAt: now,
    updatedAt: now,
  })
  return NextResponse.json({ id, title }, { status: 201 })
}
