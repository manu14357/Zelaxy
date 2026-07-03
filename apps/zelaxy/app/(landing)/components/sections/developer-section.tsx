'use client'

import { Reveal, SectionTag, Viewport } from '@/app/(landing)/components/blueprint/primitives'

const DEV = [
  ['TypeScript SDK', 'Type-safe blocks, tools and triggers.'],
  ['Python SDK', 'Drive workflows from notebooks or services.'],
  ['REST + Streaming', 'Run any workflow over HTTP with SSE output.'],
  ['Webhooks', 'Trigger from Gmail, GitHub, Stripe and more.'],
  ['Custom Nodes', 'Ship your own blocks with full UI control.'],
  ['Git Sync', 'Workflows are JSON — review them in PRs.'],
  ['CLI', 'Scaffold, deploy and inspect from the terminal.'],
  ['Open Source', 'MIT licensed. Read it. Fork it. Extend it.'],
]

/* a faux serialized-workflow JSON, syntax-tinted with theme tokens */
function CodeBody() {
  const k = 't-accent'
  const s = 't-ink'
  const p = 't-faint'
  return (
    <pre className='overflow-x-auto p-5 font-blueprint text-[12.5px] leading-[1.7]'>
      <code className='t-dim'>
        <span className={p}>{'// workflow.zelaxy.json'}</span>
        {'\n'}
        {'{'}
        {'\n  '}
        <span className={k}>"id"</span>: <span className={s}>"support-triage"</span>,{'\n  '}
        <span className={k}>"trigger"</span>: {'{'} <span className={k}>"type"</span>:{' '}
        <span className={s}>"webhook"</span> {'}'},{'\n  '}
        <span className={k}>"blocks"</span>: [{'\n    '}
        {'{'} <span className={k}>"id"</span>: <span className={s}>"classify"</span>,{' '}
        <span className={k}>"tool"</span>: <span className={s}>"agent"</span>,{' '}
        <span className={k}>"model"</span>: <span className={s}>"claude-haiku-4-5"</span> {'}'},
        {'\n    '}
        {'{'} <span className={k}>"id"</span>: <span className={s}>"route"</span>,{' '}
        <span className={k}>"tool"</span>: <span className={s}>"router"</span>,{' '}
        <span className={k}>"paths"</span>: <span className={s}>4</span> {'}'},{'\n    '}
        {'{'} <span className={k}>"id"</span>: <span className={s}>"reply"</span>,{' '}
        <span className={k}>"tool"</span>: <span className={s}>"gmail.send"</span> {'}'}
        {'\n  '}
        ],
        {'\n  '}
        <span className={k}>"edges"</span>: [<span className={s}>"classify→route→reply"</span>]
        {'\n'}
        {'}'}
      </code>
    </pre>
  )
}

export function DeveloperSection() {
  return (
    <section id='developers' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='mx-auto max-w-[1320px] px-5 sm:px-8'>
        <Reveal>
          <SectionTag id='07' name='Developers' coord='API-FIRST' />
        </Reveal>

        <div className='mt-10 max-w-2xl'>
          <Reveal>
            <h2 className='t-ink bp-display font-semibold text-[clamp(2rem,5vw,3.8rem)]'>
              Every canvas is
              <br />
              just <span className='t-accent'>code.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className='t-dim mt-6 text-[16px] leading-relaxed'>
              What you build visually serializes to clean JSON you can diff, review, and version.
              Drop to the SDK, CLI or API whenever you want — nothing is locked behind the UI.
            </p>
          </Reveal>
        </div>

        <div className='mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12'>
          {/* code viewport — no label prop: the inner tab-bar IS the header.
               Passing label would create a second absolute overlay that collides
               with the traffic-light bar and produces merged text. */}
          <Reveal>
            <Viewport className='overflow-hidden rounded-xl'>
              <div className='b-hair flex items-center gap-1.5 border-b px-4 py-3'>
                <span className='s-accent h-2.5 w-2.5 rounded-full' />
                <span className='s-accent-strong h-2.5 w-2.5 rounded-full' />
                <span className='s-line-strong h-2.5 w-2.5 rounded-full' />
                <span className='t-accent bp-label ml-3'>terminal</span>
                <span className='hair mx-2 h-3 w-px' />
                <span className='t-faint bp-label'>workflow.zelaxy.json</span>
              </div>
              <CodeBody />
            </Viewport>
          </Reveal>

          {/* dev capabilities */}
          <Reveal delay={0.08}>
            <div className='b-hair grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2'>
              {DEV.map(([name, desc]) => (
                <div key={name} className='cap-cell s-panel p-5'>
                  <h3 className='cap-name t-ink font-semibold text-[14px]'>{name}</h3>
                  <p className='t-dim mt-1.5 text-[13px] leading-relaxed'>{desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
