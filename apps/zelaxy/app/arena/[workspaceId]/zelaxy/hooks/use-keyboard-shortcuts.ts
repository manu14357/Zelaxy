'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Detect if the current platform is Mac
 */
export function isMacPlatform() {
  if (typeof navigator === 'undefined') return false
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

/**
 * Get a formatted keyboard shortcut string for display
 * @param key The key part of the shortcut (e.g., "Enter")
 * @param requiresCmd Whether the shortcut requires Cmd/Ctrl
 * @param requiresShift Whether the shortcut requires Shift
 * @param requiresAlt Whether the shortcut requires Alt/Option
 */
export function getKeyboardShortcutText(
  key: string,
  requiresCmd = false,
  requiresShift = false,
  requiresAlt = false
) {
  const isMac = isMacPlatform()
  const cmdKey = isMac ? '⌘' : 'Ctrl'
  const altKey = isMac ? '⌥' : 'Alt'
  const shiftKey = '⇧'

  const parts: string[] = []
  if (requiresCmd) parts.push(cmdKey)
  if (requiresShift) parts.push(shiftKey)
  if (requiresAlt) parts.push(altKey)
  parts.push(key)

  return parts.join('+')
}

/**
 * Hook to manage keyboard shortcuts
 * @param onRunWorkflow - Function to run when Cmd/Ctrl+Enter is pressed
 * @param isDisabled - Whether shortcuts should be disabled
 */
export function useKeyboardShortcuts(
  onRunWorkflow: () => void,
  isDisabled = false,
  options?: { onUndo?: () => void; onRedo?: () => void }
) {
  // Memoize the platform detection
  const isMac = useMemo(() => isMacPlatform(), [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable element
      const activeElement = document.activeElement
      const isEditableElement =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.hasAttribute('contenteditable')

      if (isEditableElement) return

      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

      // Run workflow with Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if (event.key === 'Enter' && cmdOrCtrl) {
        if (!isDisabled) {
          event.preventDefault()
          onRunWorkflow()
        }
        return
      }

      // Undo with Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if (event.key === 'z' && cmdOrCtrl && !event.shiftKey) {
        event.preventDefault()
        options?.onUndo?.()
        return
      }

      // Redo with Cmd+Shift+Z (Mac) or Ctrl+Shift+Z / Ctrl+Y (Windows/Linux)
      if ((event.key === 'z' && cmdOrCtrl && event.shiftKey) || (event.key === 'y' && cmdOrCtrl)) {
        event.preventDefault()
        options?.onRedo?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRunWorkflow, isDisabled, isMac, options])
}

/**
 * Hook to manage global navigation shortcuts
 */
export function useGlobalShortcuts() {
  const router = useRouter()
  const isMac = useMemo(() => isMacPlatform(), [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable element
      const activeElement = document.activeElement
      const isEditableElement =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.hasAttribute('contenteditable')

      if (isEditableElement) return

      // Cmd/Ctrl + Shift + L - Navigate to Logs
      if (
        event.key.toLowerCase() === 'l' &&
        event.shiftKey &&
        ((isMac && event.metaKey) || (!isMac && event.ctrlKey))
      ) {
        event.preventDefault()

        const pathParts = window.location.pathname.split('/')
        const workspaceIndex = pathParts.indexOf('workspace')

        if (workspaceIndex !== -1 && pathParts[workspaceIndex + 1]) {
          const workspaceId = pathParts[workspaceIndex + 1]
          router.push(`/arena/${workspaceId}/logs`)
        } else {
          router.push('/workspace')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, isMac])
}
