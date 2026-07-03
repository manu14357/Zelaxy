'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* --------------------------------------------------------------------------
   Reveal — scroll-triggered entrance that respects prefers-reduced-motion.
   -------------------------------------------------------------------------- */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'span' | 'li'
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] as typeof motion.div
  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -5% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  )
}

/* --------------------------------------------------------------------------
   SectionTag — the engineering header: §ID / NAME ........ coordinate
   -------------------------------------------------------------------------- */
export function SectionTag({ id, name, coord }: { id: string; name: string; coord?: string }) {
  return (
    <div className='bp-label flex items-center gap-3'>
      <span style={{ color: 'var(--bp-accent)' }}>§{id}</span>
      <span className='h-px w-6' style={{ background: 'var(--bp-line-strong)' }} />
      <span style={{ color: 'var(--bp-ink-dim)' }}>{name}</span>
      {coord && (
        <>
          <span
            className='ml-auto hidden h-px flex-1 sm:block'
            style={{ background: 'var(--bp-line)' }}
          />
          <span className='hidden sm:inline' style={{ color: 'var(--bp-ink-faint)' }}>
            {coord}
          </span>
        </>
      )}
    </div>
  )
}

/* Small CAD crosshair / plus mark for grid intersections */
export function Plus({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 12 12' className={className} aria-hidden='true'>
      <path d='M6 0v12M0 6h12' stroke='currentColor' strokeWidth='1' />
    </svg>
  )
}

/* A dimensioned blueprint frame (corner ticks + optional label) */
export function Viewport({
  children,
  label,
  className,
  scan = false,
}: {
  children: ReactNode
  label?: string
  className?: string
  scan?: boolean
}) {
  return (
    <div className={`bp-frame bp-corners relative ${className ?? ''}`}>
      {label && (
        <div
          className='bp-label absolute top-0 left-0 z-20 flex items-center gap-2 px-3 py-2'
          style={{ color: 'var(--bp-ink-dim)' }}
        >
          <span
            className='bp-blink h-1.5 w-1.5 rounded-full'
            style={{ background: 'var(--bp-accent)' }}
          />
          {label}
        </div>
      )}
      {scan && (
        <div className='pointer-events-none absolute inset-0 z-10 overflow-hidden'>
          <div
            className='bp-scan h-px w-full'
            style={{
              background: 'linear-gradient(90deg, transparent, var(--bp-accent-line), transparent)',
            }}
          />
        </div>
      )}
      {children}
    </div>
  )
}

/* --------------------------------------------------------------------------
   Counter — animates a number up when scrolled into view.
   -------------------------------------------------------------------------- */
export function Counter({
  to,
  suffix = '',
  className,
}: {
  to: number
  suffix?: string
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(reduce ? to : 0)

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    let raf = 0
    let started = false
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true
          const start = performance.now()
          const dur = 1400
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / dur)
            const eased = 1 - (1 - p) ** 3
            setVal(Math.round(eased * to))
            if (p < 1) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, reduce])

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString()}
      {suffix}
    </span>
  )
}
