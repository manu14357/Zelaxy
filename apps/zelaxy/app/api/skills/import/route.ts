import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { parseSkillMarkdown } from '@/lib/skills/parse'
import { db } from '@/db'
import { agentSkill } from '@/db/schema'

const logger = createLogger('SkillsImportAPI')

export const dynamic = 'force-dynamic'

const ImportSchema = z.object({
  workspaceId: z.string().min(1),
  source: z.enum(['paste', 'github']),
  content: z.string().optional(), // raw SKILL.md (paste)
  url: z.string().url().optional(), // GitHub URL (github)
})

/** Turn a GitHub blob URL into its raw equivalent. */
function toRawGithubUrl(url: string): string {
  if (url.includes('raw.githubusercontent.com')) return url
  return url
    .replace('https://github.com/', 'https://raw.githubusercontent.com/')
    .replace('/blob/', '/')
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof ImportSchema>
  try {
    body = ImportSchema.parse(await req.json())
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'Invalid body'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const permission = await getUserEntityPermissions(session.user.id, 'workspace', body.workspaceId)
  if (permission !== 'write' && permission !== 'admin') {
    return NextResponse.json({ error: 'Write access required' }, { status: 403 })
  }

  // Resolve raw markdown.
  let raw = body.content || ''
  if (body.source === 'github') {
    if (!body.url)
      return NextResponse.json({ error: 'url is required for GitHub import' }, { status: 400 })
    try {
      const res = await fetch(toRawGithubUrl(body.url), {
        headers: { 'User-Agent': 'Zelaxy-Skills' },
      })
      if (!res.ok) throw new Error(`GitHub fetch returned ${res.status}`)
      raw = await res.text()
    } catch (e) {
      return NextResponse.json(
        { error: `Failed to fetch from GitHub: ${e instanceof Error ? e.message : 'error'}` },
        { status: 502 }
      )
    }
  }
  if (!raw.trim()) return NextResponse.json({ error: 'No skill content provided' }, { status: 400 })

  let parsed: ReturnType<typeof parseSkillMarkdown>
  try {
    parsed = parseSkillMarkdown(raw)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Parse failed' },
      { status: 400 }
    )
  }

  // Upsert by name (re-importing a skill updates it).
  const [existing] = await db
    .select({ id: agentSkill.id })
    .from(agentSkill)
    .where(and(eq(agentSkill.workspaceId, body.workspaceId), eq(agentSkill.name, parsed.name)))
    .limit(1)

  const now = new Date()
  if (existing) {
    await db
      .update(agentSkill)
      .set({ description: parsed.description, content: parsed.content, updatedAt: now })
      .where(eq(agentSkill.id, existing.id))
    logger.info(`Updated imported skill "${parsed.name}"`)
    return NextResponse.json({ id: existing.id, name: parsed.name, updated: true })
  }

  const id = randomUUID()
  await db.insert(agentSkill).values({
    id,
    workspaceId: body.workspaceId,
    name: parsed.name,
    description: parsed.description,
    content: parsed.content,
    createdBy: session.user.id,
    createdAt: now,
    updatedAt: now,
  })
  logger.info(`Imported skill "${parsed.name}"`)
  return NextResponse.json({ id, name: parsed.name, created: true }, { status: 201 })
}
