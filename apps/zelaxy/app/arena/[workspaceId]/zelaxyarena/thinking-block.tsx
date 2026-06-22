'use client'

import { useEffect, useRef, useState } from 'react'
import { Brain, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Collapsible reasoning panel. Auto-expands while the model is still thinking and collapses once
 * the answer starts, matching the reference copilot's thinking UI. Fed by the `<thinking>…</thinking>`
 * segment parsed out of the assistant stream (see splitThinking).
 */
export function ThinkingBlock({ content, isActive }: { content: string; isActive: boolean }) {
  const [open, setOpen] = useState(isActive)
  const [userToggled, setUserToggled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Follow the stream (open while thinking, collapse when done) until the user takes manual control.
  useEffect(() => {
    if (!userToggled) setOpen(isActive)
  }, [isActive, userToggled])

  // Auto-scroll the reasoning to the latest line while it streams in.
  useEffect(() => {
    if (open && isActive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [content, open, isActive])

  // Min-content gate: don't flash the panel for a trivial fragment of reasoning.
  if (content.trim().length < 2) return null

  return (
    <div className='mb-2 overflow-hidden rounded-lg border border-border/50 bg-background/40'>
      <button
        type='button'
        onClick={() => {
          setUserToggled(true)
          setOpen((o) => !o)
        }}
        className='flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground'
      >
        <Brain className={cn('h-3.5 w-3.5', isActive && 'animate-pulse text-primary')} />
        <span>{isActive ? 'Thinking…' : 'Thought process'}</span>
        <ChevronDown
          className={cn('ml-auto h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          ref={scrollRef}
          className='max-h-48 overflow-auto border-border/40 border-t px-2.5 py-2 text-[12px] text-muted-foreground leading-relaxed'
        >
          <p className='whitespace-pre-wrap'>{content.trim()}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Split an assistant message into its reasoning (inside `<thinking>`/`<think>`) and the answer.
 * Handles the streaming case where the closing tag hasn't arrived yet (reasoning still in progress).
 */
export function splitThinking(content: string): { thinking: string | null; text: string } {
  const open = content.match(/<think(?:ing)?>/i)
  if (!open || open.index === undefined) return { thinking: null, text: content }
  const start = open.index + open[0].length
  const rest = content.slice(start)
  const close = rest.match(/<\/think(?:ing)?>/i)
  if (close && close.index !== undefined) {
    const thinking = rest.slice(0, close.index)
    const before = content.slice(0, open.index)
    const after = rest.slice(close.index + close[0].length)
    return { thinking, text: `${before}${after}`.trim() }
  }
  // Closing tag not streamed yet — everything after the open tag is the live reasoning.
  return { thinking: rest, text: content.slice(0, open.index).trim() }
}
