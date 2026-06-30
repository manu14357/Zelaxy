'use client'

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
  return (
    <section id='lifecycle' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='mx-auto grid max-w-[1320px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16'>
        {/* heading */}
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
          <div className='relative'>
            {/* base rail */}
            <div className='hair absolute top-4 bottom-4 left-[19px] w-px' />
            {/* signal flowing down the rail */}
            <svg
              className='pointer-events-none absolute top-4 bottom-4 left-[19px] w-px overflow-visible'
              preserveAspectRatio='none'
              aria-hidden='true'
            >
              <line
                x1='0'
                y1='0'
                x2='0'
                y2='100%'
                className='bp-signal'
                stroke='var(--bp-accent)'
                strokeWidth='1.5'
              />
            </svg>

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
