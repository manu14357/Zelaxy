'use client'

import { memo, useEffect, useRef, useState } from 'react'
import CopilotMarkdownRenderer from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/panel/components/copilot/components/copilot-message/components/markdown-renderer'

/**
 * Renders assistant markdown with a character-by-character typewriter reveal while streaming, and
 * snaps to the full content the moment streaming ends. Same technique Agie uses for its copilot
 * messages — extracted here so ZelaxyArena's stream feels identical (no choppy chunk jumps).
 */
interface SmoothStreamingTextProps {
  content: string
  isStreaming: boolean
}

export const SmoothStreamingText = memo(
  ({ content, isStreaming }: SmoothStreamingTextProps) => {
    const [displayedContent, setDisplayedContent] = useState('')
    const contentRef = useRef(content)
    const rafRef = useRef<number | null>(null)
    const indexRef = useRef(0)
    const isAnimatingRef = useRef(false)

    // Cancel any in-flight animation frame on unmount only.
    useEffect(
      () => () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      },
      []
    )

    useEffect(() => {
      contentRef.current = content

      if (content.length === 0) {
        setDisplayedContent('')
        indexRef.current = 0
        return
      }

      // Streaming finished — snap to the full content and stop the loop.
      if (!isStreaming) {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        isAnimatingRef.current = false
        setDisplayedContent(content)
        indexRef.current = content.length
        return
      }

      // Streaming: reveal via requestAnimationFrame (≤60fps) instead of a 3ms setTimeout per char
      // (which re-parsed the whole markdown AST hundreds of times a second). Each frame reveals a
      // chunk proportional to how far behind we are, so the reveal catches up smoothly. The loop
      // reads contentRef so it always sees the latest streamed text without restarting per token.
      if (!isAnimatingRef.current && indexRef.current < content.length) {
        isAnimatingRef.current = true
        const tick = () => {
          const full = contentRef.current
          if (indexRef.current >= full.length) {
            isAnimatingRef.current = false
            rafRef.current = null
            return
          }
          const remaining = full.length - indexRef.current
          const step = Math.max(2, Math.ceil(remaining / 8))
          indexRef.current = Math.min(full.length, indexRef.current + step)
          setDisplayedContent(full.slice(0, indexRef.current))
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      }
    }, [content, isStreaming])

    return (
      <div className='relative max-w-full overflow-hidden' style={{ minHeight: '1.25rem' }}>
        <CopilotMarkdownRenderer content={displayedContent} />
      </div>
    )
  },
  (prev, next) => prev.content === next.content && prev.isStreaming === next.isStreaming
)

SmoothStreamingText.displayName = 'SmoothStreamingText'
