import { eq, sql } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { templates } from '@/db/schema'

const logger = createLogger('TemplateByIdAPI')

export const revalidate = 0

const UpdateTemplateSchema = z.object({
  isHidden: z.boolean(),
})

// GET /api/templates/[id] - Retrieve a single template by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      logger.warn(`[${requestId}] Unauthorized template access attempt for ID: ${id}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug(`[${requestId}] Fetching template: ${id}`)

    // Fetch the template by ID
    const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1)

    if (result.length === 0) {
      logger.warn(`[${requestId}] Template not found: ${id}`)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = result[0]

    // Hidden templates are only visible to the creator who hid them
    if (template.isHidden && template.userId !== session.user.id) {
      logger.warn(`[${requestId}] Attempt to access hidden template: ${id}`)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Increment the view count
    try {
      await db
        .update(templates)
        .set({
          views: sql`${templates.views} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(templates.id, id))

      logger.debug(`[${requestId}] Incremented view count for template: ${id}`)
    } catch (viewError) {
      // Log the error but don't fail the request
      logger.warn(`[${requestId}] Failed to increment view count for template: ${id}`, viewError)
    }

    logger.info(`[${requestId}] Successfully retrieved template: ${id}`)

    return NextResponse.json({
      data: {
        ...template,
        views: template.views + 1, // Return the incremented view count
      },
    })
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching template: ${id}`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/templates/[id] - Hide/unhide a template (creator only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      logger.warn(`[${requestId}] Unauthorized template update attempt for ID: ${id}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = UpdateTemplateSchema.parse(body)

    const result = await db
      .select({ id: templates.id, userId: templates.userId })
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1)

    if (result.length === 0) {
      logger.warn(`[${requestId}] Template not found: ${id}`)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (result[0].userId !== session.user.id) {
      logger.warn(`[${requestId}] User ${session.user.id} may not modify template ${id}`)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await db
      .update(templates)
      .set({ isHidden: data.isHidden, updatedAt: new Date() })
      .where(eq(templates.id, id))

    logger.info(`[${requestId}] Set template ${id} isHidden=${data.isHidden}`)

    return NextResponse.json({ id, isHidden: data.isHidden })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    logger.error(`[${requestId}] Error updating template: ${id}`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/templates/[id] - Delete a template (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      logger.warn(`[${requestId}] Unauthorized template delete attempt for ID: ${id}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db
      .select({ id: templates.id, userId: templates.userId })
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1)

    if (result.length === 0) {
      logger.warn(`[${requestId}] Template not found: ${id}`)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (result[0].userId !== session.user.id) {
      logger.warn(`[${requestId}] User ${session.user.id} may not delete template ${id}`)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await db.delete(templates).where(eq(templates.id, id))

    logger.info(`[${requestId}] Deleted template: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error(`[${requestId}] Error deleting template: ${id}`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
