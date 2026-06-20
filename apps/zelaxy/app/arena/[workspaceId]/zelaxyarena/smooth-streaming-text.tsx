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
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const indexRef = useRef(0)
    const isAnimatingRef = useRef(false)

    useEffect(() => {
      contentRef.current = content

      if (content.length === 0) {
        setDisplayedContent('')
        indexRef.current = 0
        return
      }

      if (isStreaming) {
        if (indexRef.current < content.length) {
          const animateText = () => {
            const currentContent = contentRef.current
            const currentIndex = indexRef.current
            if (currentIndex < currentContent.length) {
              setDisplayedContent(currentContent.slice(0, currentIndex + 1))
              indexRef.current = currentIndex + 1
              timeoutRef.current = setTimeout(animateText, 3)
            } else {
              isAnimatingRef.current = false
            }
          }
          if (!isAnimatingRef.current) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            isAnimatingRef.current = true
            animateText()
          }
        }
      } else {
        // Streaming finished — show everything immediately.
        setDisplayedContent(content)
        indexRef.current = content.length
        isAnimatingRef.current = false
      }

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        isAnimatingRef.current = false
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
