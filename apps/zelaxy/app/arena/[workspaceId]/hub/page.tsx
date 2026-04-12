import { Suspense } from 'react'
import { and, desc, eq, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import type { Template } from '@/app/arena/[workspaceId]/templates/templates'
import { db } from '@/db'
import { templateStars, templates } from '@/db/schema'
import { Hub } from './hub'

export default async function HubPage() {
  const session = await getSession()

  if (!session?.user?.id) {
    return <div>Please log in to access the hub</div>
  }

  // Fetch templates server-side (same query as templates page)
  const templatesData = await db
    .select({
      id: templates.id,
      workflowId: templates.workflowId,
      userId: templates.userId,
      name: templates.name,
      description: templates.description,
      author: templates.author,
      views: templates.views,
      stars: templates.stars,
      color: templates.color,
      icon: templates.icon,
      category: templates.category,
      state: templates.state,
      createdAt: templates.createdAt,
      updatedAt: templates.updatedAt,
      isStarred: sql<boolean>`CASE WHEN ${templateStars.id} IS NOT NULL THEN true ELSE false END`,
    })
    .from(templates)
    .leftJoin(
      templateStars,
      and(eq(templateStars.templateId, templates.id), eq(templateStars.userId, session.user.id))
    )
    .orderBy(desc(templates.views), desc(templates.createdAt))

  return (
    <Suspense>
      <Hub
        initialTemplates={templatesData as unknown as Template[]}
        currentUserId={session.user.id}
      />
    </Suspense>
  )
}
