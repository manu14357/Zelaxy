'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Reveal, SectionTag } from '@/app/(landing)/components/blueprint/primitives'

const STEPS = [
  ['01', 'Idea', 'Start from a goal, a template, or a blank canvas.'],
  ['02', 'Drag', 'Place agents, models, logic and integrations as blocks.'],
  ['03', 'Connect', 'Wire data flow — branch, loop, and run paths in parallel.'],
  ['04', 'Knowledge', 'Attach documents, vector stores and persistent memory.'],
  ['05', 'Reason', 'Agents plan, call tools, and decide with LLM-as-judge.'],
  ['06', 'Test', 'Run live and inspect every block, token by token.'],
  ['07', 'Deploy', 'Ship as an API, webhook, schedule, or chat endpoint.'],
  ['08', 'Observe', 'Trace every run with execution logs and metrics.'],
  ['09', 'Improve', 'Version, branch, and iterate together with your team.'],
]

export function LifecycleSection() {
  const reduce = useReducedMotion()
  const stepsRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0

    function update() {
      const fill = fillRef.current
      const col = stepsRef.current
      if (!fill || !col) return

      const rect = col.getBoundingClientRect()
      // The rail visually spans `top-4 bottom-4` → 16px inset top & bottom.
      const railLen = Math.max(0, rect.height - 32)

      if (reduce) {
        fill.style.height = `${railLen}px`
        return
      }

      const vh = window.innerHeight
      // "Read line" sits at 50% of the viewport; the signal fills down to
      // wherever that line currently intersects the steps column.
      const readLine = vh * 0.5
      // Distance from the rail's start (rect.top + 16) down to the read line.
      const filledPx = readLine - (rect.top + 16)
      const h = Math.max(0, Math.min(railLen, filledPx))
      fill.style.height = `${h}px`
    }

    // Coalesce scroll events into a single rAF write
    function onScroll() {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        update()
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update() // initial position
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduce])

  return (
    <section id='lifecycle' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='mx-auto grid max-w-[1320px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16'>
        {/* sticky heading */}
        <div className='lg:sticky lg:top-28 lg:self-start'>
          <Reveal>
            <SectionTag id='03' name='Lifecycle' />
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className='t-ink bp-display mt-8 font-semibold text-[clamp(2rem,4.4vw,3.4rem)]'>
              From idea to
              <br />
              production, on
              <br />
              <span className='t-accent'>one surface.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className='t-dim mt-6 max-w-sm text-[16px] leading-relaxed'>
              No context-switching between a prompt playground, a code editor, and a scheduler. The
              whole loop lives on the canvas.
            </p>
          </Reveal>
        </div>

        {/* steps with rail */}
        <Reveal delay={0.06}>
          <div ref={stepsRef} className='relative'>
            {/* base rail — faint gray, always full height */}
            <div className='hair absolute top-4 bottom-4 left-[19px] w-px' />

            {/* animated orange signal — a height-controlled div (no SVG).
                JS grows its height in px as you scroll; the CSS gradient +
                bp-rail-flow animation makes the dashes travel downward. */}
            <div
              ref={fillRef}
              className='bp-rail-signal pointer-events-none absolute top-4 left-[19px] w-[2px]'
              aria-hidden='true'
            />

            <ol className='space-y-9'>
              {STEPS.map(([n, title, desc], i) => (
                <Reveal as='li' key={n} delay={i * 0.05} className='relative flex gap-6'>
                  <span className='s-panel b-strong relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border'>
                    <span className='bp-label t-dim' style={{ fontSize: '10px' }}>
                      {n}
                    </span>
                  </span>
                  <div className='pt-1'>
                    <h3 className='t-ink font-semibold text-[17px] tracking-[-0.01em]'>{title}</h3>
                    <p className='t-dim mt-1 max-w-md text-[15px] leading-relaxed'>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
