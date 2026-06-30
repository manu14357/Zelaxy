'use client'

import Link from 'next/link'
import { getDocsUrl } from '@/lib/docs-url'
import { Reveal } from '@/app/(landing)/components/blueprint/primitives'

export function CTASection() {
  return (
    <section id='start' className='s-bg relative overflow-hidden py-32 sm:py-44'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='bp-grid-field pointer-events-none absolute inset-0 opacity-60' />
      <div className='glow-center pointer-events-none absolute inset-0' />

      <div className='relative mx-auto max-w-3xl px-6 text-center'>
        <Reveal>
          <div className='b-hair s-panel bp-label mb-8 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5'>
            <span className='bp-pulse s-accent h-1.5 w-1.5 rounded-full' />
            <span className='t-dim'>System ready</span>
            <span className='hair h-3 w-px' />
            <span className='t-faint'>Open source · MIT</span>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className='t-ink bp-display font-semibold text-[clamp(2.4rem,6.5vw,5rem)]'>
            Build the next
            <br />
            <span className='t-accent bp-glow'>intelligent system.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className='t-dim mx-auto mt-7 max-w-lg text-[17px] leading-relaxed'>
            Free to start. Deploy anywhere. Join the builders composing production AI on the canvas
            — local or cloud.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Link
              href='/arena'
              className='btn-accent group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-8 font-medium text-[15px] sm:w-auto'
            >
              Start Building
              <span className='transition-transform group-hover:translate-x-0.5'>→</span>
            </Link>
            <a
              href={getDocsUrl()}
              className='btn-ghost inline-flex h-12 w-full items-center justify-center rounded-lg px-7 font-medium text-[15px] sm:w-auto'
            >
              Read the Docs
            </a>
            <a
              href='https://github.com/manu14357/Zelaxy'
              target='_blank'
              rel='noopener noreferrer'
              className='btn-ghost inline-flex h-12 w-full items-center justify-center rounded-lg px-7 font-medium text-[15px] sm:w-auto'
            >
              Star on GitHub
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <div className='bp-label mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2'>
            {['No credit card', 'Self-host in minutes', 'LLM-agnostic'].map((s, i) => (
              <span key={s} className='flex items-center gap-3'>
                {i > 0 && <span className='t-faint'>/</span>}
                <span className='t-dim'>{s}</span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
