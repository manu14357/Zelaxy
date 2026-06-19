import type { Metadata } from 'next'
import { ZelaxyArena } from '@/app/arena/[workspaceId]/zelaxyarena/zelaxyarena'

export const metadata: Metadata = {
  title: 'ZelaxyArena',
}

export default function ZelaxyArenaPage() {
  return <ZelaxyArena />
}
