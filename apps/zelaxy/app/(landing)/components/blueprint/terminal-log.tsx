'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const LINES = [
  ['trigger', 'webhook/gmail · payload received'],
  ['agent', 'agent · claude-opus-4-8 · planning'],
  ['tool', 'mcp/github · list_issues → 12'],
  ['knowledge', 'knowledge · vector search → 6 hits'],
  ['memory', 'memory · upsert key=session'],
  ['router', 'router · llm-judge → escalate'],
  ['response', 'run #4821 · ok · 1.28s · $0.004'],
] as const

export function TerminalLog() {
  const reduce = useReducedMotion()
  // All lines stay visible at all times; a single "active" row pulses to keep
  // the log feeling live without ever hiding rows.
  const [active, setActive] = useState(LINES.length - 1)

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setActive((a) => (a + 1) % LINES.length), 1300)
    return () => clearInterval(t)
  }, [reduce])

  return (
    <div className='font-blueprint text-[11px] leading-[1.65]'>
      {LINES.map(([tag, msg], i) => (
        <div key={tag} className='flex items-center gap-2 whitespace-nowrap'>
          <span className='t-faint'>{String(i + 1).padStart(2, '0')}</span>
          <span className='t-accent w-[68px] shrink-0'>{tag}</span>
          <span className={`truncate ${i === active ? 't-ink' : 't-dim'}`}>{msg}</span>
          {i === active && !reduce && (
            <span className='bp-pulse s-accent ml-auto h-1.5 w-1.5 shrink-0 rounded-full' />
          )}
        </div>
      ))}
      <div className='flex items-center gap-2'>
        <span className='t-faint'>{String(LINES.length + 1).padStart(2, '0')}</span>
        <span className='t-accent'>›</span>
        <span className='bp-blink s-accent inline-block h-3 w-1.5' />
      </div>
    </div>
  )
}
