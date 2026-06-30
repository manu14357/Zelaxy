'use client'

import { Reveal, SectionTag } from '@/app/(landing)/components/blueprint/primitives'

const FAILURES = [
  {
    id: 'A',
    name: 'Chatbots',
    line: 'A prompt window is not a system. It forgets, it can’t act, and nothing is reproducible.',
  },
  {
    id: 'B',
    name: 'Glue code',
    line: 'Scripts and SDKs rot. Every integration is bespoke, brittle, and invisible to your team.',
  },
  {
    id: 'C',
    name: 'Rigid automation',
    line: 'Linear pipelines can’t reason. The moment logic branches, they break.',
  },
]

export function ManifestoSection() {
  return (
    <section id='manifesto' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='mx-auto max-w-[1320px] px-5 sm:px-8'>
        <Reveal>
          <SectionTag id='01' name='Manifesto' coord='52.3°N · LAT' />
        </Reveal>

        {/* Thesis */}
        <div className='mt-12 grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[0.9fr_1.1fr]'>
          <Reveal>
            <p className='bp-label t-faint'>The problem</p>
            <h2 className='t-ink bp-display mt-5 font-semibold text-[clamp(2rem,4.6vw,3.6rem)]'>
              AI got smart.
              <br />
              The <span className='t-accent'>tooling</span> didn’t.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className='t-dim space-y-5 text-[17px] leading-relaxed lg:pt-16'>
              <p>
                Models can reason, call tools, and write code. Yet most teams still wire them
                together with copy-pasted prompts, throwaway scripts, and dashboards no one trusts.
              </p>
              <p className='t-ink'>
                Intelligence is no longer the bottleneck.{' '}
                <span className='t-accent'>Building with it is.</span>
              </p>
            </div>
          </Reveal>
        </div>

        {/* Why existing tools fail */}
        <div className='b-hair mt-20 border-t pt-10'>
          <Reveal>
            <p className='bp-label t-faint'>Why existing tools fail</p>
          </Reveal>
          <div className='b-hair mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border md:grid-cols-3'>
            {FAILURES.map((f, i) => (
              <Reveal key={f.id} delay={i * 0.08}>
                <div className='s-panel relative h-full p-7'>
                  <div className='bp-label mb-5 flex items-center gap-3'>
                    <span className='b-hair t-faint grid h-6 w-6 place-items-center rounded border'>
                      {f.id}
                    </span>
                    <span className='t-dim'>{f.name}</span>
                    <span aria-hidden className='t-faint ml-auto text-base'>
                      ✕
                    </span>
                  </div>
                  <p className='t-dim text-[15px] leading-relaxed'>{f.line}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* The shift */}
        <div className='b-hair mt-20 grid grid-cols-1 items-end gap-8 border-t pt-12 lg:grid-cols-[1.1fr_0.9fr]'>
          <Reveal>
            <p className='bp-label t-faint'>The shift</p>
            <p className='t-ink mt-5 font-medium text-[clamp(1.5rem,3vw,2.4rem)] leading-[1.25] tracking-[-0.02em]'>
              AI systems are graphs of decisions, memory and tools. They should be{' '}
              <span className='t-accent'>built like systems</span> — seen, versioned, and run — not
              hidden inside a chat box.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className='s-panel b-hair rounded-xl border p-6'>
              <p className='bp-label t-faint'>Zelaxy — premise</p>
              <p className='t-dim mt-4 text-[15px] leading-relaxed'>
                One visual canvas where humans and agents build, connect, reason, and deploy
                production AI — local or cloud, with every run observable.
              </p>
              <div className='bp-label mt-5 flex flex-wrap gap-2'>
                {['Build', 'Connect', 'Reason', 'Deploy', 'Scale'].map((s) => (
                  <span key={s} className='b-hair t-dim rounded border px-2.5 py-1'>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
