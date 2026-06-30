'use client'

import { useEffect, useState } from 'react'
import { Counter, Reveal, SectionTag } from '@/app/(landing)/components/blueprint/primitives'

const GITHUB_REPO = 'manu14357/Zelaxy'

const EXTEND = ['Custom Tools', 'Custom Blocks', 'MCP Servers', 'Templates', 'Skills', 'Open APIs']

const TEMPLATES = [
  { name: 'Support Triage', by: 'core', kinds: ['trigger', 'agent', 'email'] },
  { name: 'Research Crew', by: 'community', kinds: ['agent', 'knowledge', 'decision'] },
  { name: 'Data Pipeline', by: 'community', kinds: ['db', 'loop', 'deploy'] },
] as const

const GLYPH: Record<string, string> = {
  trigger: 'M9 1 3 9h5l-1 6 6-9H8z',
  agent: 'M8 1l6.5 3.7v6.6L8 15 1.5 11.3V4.7z',
  email: 'M2 4h12v8H2z M2 4l6 5 6-5',
  knowledge: 'M3.5 4h9 M4 5l4 7 M12 5l-4 7',
  decision: 'M8 1l7 7-7 7-7-7z',
  db: 'M3 4c0 1.3 2.2 2.4 5 2.4S13 5.3 13 4 10.8 1.6 8 1.6 3 2.7 3 4z M3 4v8c0 1.3 2.2 2.4 5 2.4s5-1.1 5-2.4V4',
  loop: 'M13 8a5 5 0 1 1-1.5-3.6',
  deploy: 'M8 14V4 M4 7l4-4 4 4',
}

function MiniFlow({ kinds }: { kinds: readonly string[] }) {
  return (
    <svg viewBox='0 0 180 48' className='h-12 w-full' aria-hidden='true'>
      <line
        x1='30'
        y1='24'
        x2='150'
        y2='24'
        className='hair-strong'
        stroke='var(--bp-line-strong)'
        strokeWidth='1'
      />
      <line
        x1='30'
        y1='24'
        x2='150'
        y2='24'
        className='bp-signal'
        stroke='var(--bp-accent)'
        strokeWidth='1.2'
      />
      {kinds.map((k, i) => {
        const x = 30 + i * 60
        return (
          <g key={k} transform={`translate(${x - 12} 12)`}>
            <rect
              x='0'
              y='0'
              width='24'
              height='24'
              rx='5'
              fill='var(--bp-panel)'
              stroke='var(--bp-line-strong)'
            />
            <g transform='translate(4 4)' style={{ color: 'var(--bp-accent)' }}>
              <path
                d={GLYPH[k]}
                fill='none'
                stroke='currentColor'
                strokeWidth='1.2'
                strokeLinejoin='round'
                strokeLinecap='round'
              />
            </g>
          </g>
        )
      })}
    </svg>
  )
}

export function OpenSection() {
  const [stars, setStars] = useState<number | null>(null)
  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then((r) => r.json())
      .then((d) => typeof d.stargazers_count === 'number' && setStars(d.stargazers_count))
      .catch(() => {})
  }, [])

  return (
    <section id='open' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='glow-bl pointer-events-none absolute inset-0' />

      <div className='relative mx-auto max-w-[1320px] px-5 sm:px-8'>
        <Reveal>
          <SectionTag id='08' name='Open Platform' coord='MIT · BUILD IN PUBLIC' />
        </Reveal>

        <div className='mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16'>
          <div>
            <Reveal>
              <h2 className='t-ink bp-display font-semibold text-[clamp(2rem,4.6vw,3.4rem)]'>
                Extend everything.
                <br />
                <span className='t-accent'>Own everything.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className='t-dim mt-6 max-w-md text-[16px] leading-relaxed'>
                Zelaxy is open source and built to be forked. Write custom nodes, publish templates,
                wire in MCP servers, and ship your own integrations — no walled garden.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className='mt-8 flex flex-wrap gap-2'>
                {EXTEND.map((e) => (
                  <span
                    key={e}
                    className='chip s-panel b-hair t-dim rounded-md border px-3 py-1.5 text-[13px]'
                  >
                    {e}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.06}>
            <div className='b-hair grid grid-cols-2 gap-px overflow-hidden rounded-xl border'>
              <div className='s-panel p-6'>
                <div className='t-ink font-semibold text-[clamp(1.8rem,4vw,2.6rem)] tracking-tight'>
                  {stars !== null ? <Counter to={stars} /> : '★'}
                </div>
                <div className='t-faint bp-label mt-1'>GitHub stars</div>
              </div>
              {[
                { v: 271, suffix: '', label: 'Blocks' },
                { v: 250, suffix: '+', label: 'Tools' },
                { v: 25, suffix: '', label: 'Model providers' },
              ].map((s) => (
                <div key={s.label} className='s-panel p-6'>
                  <div className='t-ink font-semibold text-[clamp(1.8rem,4vw,2.6rem)] tracking-tight'>
                    <Counter to={s.v} suffix={s.suffix} />
                  </div>
                  <div className='t-faint bp-label mt-1'>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* template previews */}
        <Reveal delay={0.1}>
          <div className='mt-10'>
            <p className='bp-label t-faint'>From the template registry</p>
            <div className='b-hair mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-xl border md:grid-cols-3'>
              {TEMPLATES.map((t) => (
                <div key={t.name} className='cap-cell s-panel p-6'>
                  <MiniFlow kinds={t.kinds} />
                  <div className='mt-4 flex items-center justify-between'>
                    <h3 className='cap-name t-ink font-semibold text-[14px]'>{t.name}</h3>
                    <span className='t-faint bp-label'>@{t.by}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
