import { redirect } from 'next/navigation'

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  redirect(`/arena/${workspaceId}/hub?tab=knowledge`)
}
