import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { normalizeSkillName } from '@/lib/skills/parse'
import { db } from '@/db'
import { agentSkill } from '@/db/schema'

export const dynamic = 'force-dynamic'

/**
 * Internal endpoint backing the load_skill tool. Given a workspace + skill name, returns the
 * full skill content. Unauthenticated like other internal tool endpoints — the agent only knows
 * skill names that were injected into its own system prompt for its workspace.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const workspaceId = body?.workspaceId
    const rawName = body?.name ?? body?.skill_name
    if (!workspaceId || !rawName) {
      return NextResponse.json(
        { success: false, error: 'workspaceId and name are required' },
        { status: 400 }
      )
    }

    let name: string
    try {
      name = normalizeSkillName(String(rawName))
    } catch {
      name = String(rawName).trim().toLowerCase()
    }

    const [skill] = await db
      .select({
        name: agentSkill.name,
        description: agentSkill.description,
        content: agentSkill.content,
      })
      .from(agentSkill)
      .where(and(eq(agentSkill.workspaceId, workspaceId), eq(agentSkill.name, name)))
      .limit(1)

    if (!skill) {
      return NextResponse.json(
        { success: false, error: `No skill named "${name}" in this workspace` },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, output: skill })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load skill' },
      { status: 500 }
    )
  }
}
