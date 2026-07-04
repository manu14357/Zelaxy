/**
 * Remembers the last item the user had open in each arena section, per workspace, so returning to a
 * section (via the sidebar / a section route) resumes where they left off instead of a bare list or
 * the first item. Client-only (localStorage); every call is guarded so SSR and privacy-mode never
 * throw. Mirrors the per-workspace "last chat" restore in ZelaxyArena.
 */
export type ArenaSection = 'workflow' | 'table' | 'knowledge' | 'template'

const key = (workspaceId: string, section: ArenaSection) => `arena:last-${section}:${workspaceId}`

export function rememberLastOpened(
  workspaceId: string,
  section: ArenaSection,
  id: string | null | undefined
): void {
  if (typeof window === 'undefined' || !workspaceId || !id) return
  try {
    window.localStorage.setItem(key(workspaceId, section), id)
  } catch {
    /* ignore (SSR / storage disabled) */
  }
}

export function getLastOpened(workspaceId: string, section: ArenaSection): string | null {
  if (typeof window === 'undefined' || !workspaceId) return null
  try {
    return window.localStorage.getItem(key(workspaceId, section))
  } catch {
    return null
  }
}

export function clearLastOpened(workspaceId: string, section: ArenaSection): void {
  if (typeof window === 'undefined' || !workspaceId) return
  try {
    window.localStorage.removeItem(key(workspaceId, section))
  } catch {
    /* ignore */
  }
}
