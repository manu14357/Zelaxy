import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import Providers from '@/app/arena/[workspaceId]/providers/providers'
import { AdvancedSidebar } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/advanced-sidebar/advanced-sidebar'
import { db } from '@/db'
import { workspace } from '@/db/schema'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const session = await getSession()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Verify the workspace exists
  const workspaceExists = await db
    .select({ id: workspace.id, ownerId: workspace.ownerId })
    .from(workspace)
    .where(eq(workspace.id, workspaceId))
    .limit(1)

  if (workspaceExists.length === 0) {
    redirect('/arena')
  }

  // Check access: owner, explicit permissions, or org membership
  // getUserEntityPermissions now checks org membership for workspace entities
  const isOwner = workspaceExists[0].ownerId === session.user.id
  if (!isOwner) {
    const permission = await getUserEntityPermissions(session.user.id, 'workspace', workspaceId)
    if (!permission) {
      redirect('/arena')
    }
  }

  return (
    <Providers>
      <div className='flex min-h-screen w-full'>
        <AdvancedSidebar />
        <div className='sidebar-responsive-margin flex flex-1 flex-col'>{children}</div>
      </div>
    </Providers>
  )
}
