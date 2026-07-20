import { getDocCounts } from '@/lib/doc-counts'

/** Renders the live, always-current count of documented blocks or tools — see lib/doc-counts.ts. */
export function LiveCount({ type }: { type: 'blocks' | 'tools' }) {
  const counts = getDocCounts()
  return <>{counts[type]}</>
}
