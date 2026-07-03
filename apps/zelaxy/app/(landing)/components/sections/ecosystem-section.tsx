'use client'

import { Reveal, SectionTag } from '@/app/(landing)/components/blueprint/primitives'

const MODELS = ['OpenAI', 'Anthropic', 'Google', 'xAI', 'DeepSeek', 'Mistral', 'Groq', 'Cerebras']
const INFRA = [
  'Bedrock',
  'Azure',
  'OpenRouter',
  'Together',
  'Fireworks',
  'Ollama',
  'vLLM',
  'LiteLLM',
]

const REGISTRY = [
  'Gmail',
  'Slack',
  'GitHub',
  'Notion',
  'Jira',
  'Stripe',
  'HubSpot',
  'Airtable',
  'Linear',
  'Salesforce',
  'Discord',
  'Telegram',
  'Google Sheets',
  'Google Drive',
  'Confluence',
  'Supabase',
  'Postgres',
  'Databricks',
  'Snowflake',
  'Firecrawl',
]

function Chip({ name, up }: { name: string; up?: boolean }) {
  return (
    <div className={`flex flex-col items-center ${up ? '' : 'flex-col-reverse'}`}>
      <div className='chip s-panel b-hair flex h-9 items-center gap-2 rounded-md border px-3'>
        <span className='s-accent h-1.5 w-1.5 rounded-full' />
        <span className='t-dim whitespace-nowrap text-[13px]'>{name}</span>
      </div>
      {/* connector to the bus */}
      <div className='relative h-7 w-px'>
        <div className='hair absolute inset-0' />
        <div
          className={`absolute left-0 ${up ? 'bottom-0' : 'top-0'} -translate-x-[3px] s-accent h-1.5 w-1.5 rounded-full`}
        />
      </div>
    </div>
  )
}

export function EcosystemSection() {
  return (
    <section id='ecosystem' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='glow-center pointer-events-none absolute inset-0' />

      <div className='relative mx-auto max-w-[1320px] px-5 sm:px-8'>
        <Reveal>
          <SectionTag id='05' name='Ecosystem' coord='BUS · LLM-AGNOSTIC' />
        </Reveal>

        <div className='mt-10 max-w-2xl'>
          <Reveal>
            <h2 className='t-ink bp-display font-semibold text-[clamp(2rem,5vw,3.8rem)]'>
              Not logos. <span className='t-accent'>Infrastructure.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className='t-dim mt-6 text-[16px] leading-relaxed'>
              Every model and service connects to one runtime bus. Swap providers without rewiring.
              Run frontier models or your own local stack — Zelaxy stays agnostic.
            </p>
          </Reveal>
        </div>

        {/* the bus diagram — min-w keeps chips readable on mobile via horizontal scroll */}
        <Reveal delay={0.06}>
          <div className='relative mt-16'>
            {/* fade edges to hint that content scrolls on narrow viewports */}
            <div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[color:var(--bp-bg)] to-transparent sm:hidden' />
            <div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[color:var(--bp-bg)] to-transparent sm:hidden' />
            <div className='overflow-x-auto'>
              <div className='min-w-[760px]'>
                {/* top taps */}
                <div className='flex items-end justify-between gap-2 px-2'>
                  {MODELS.map((m) => (
                    <Chip key={m} name={m} up />
                  ))}
                </div>

                {/* the bus */}
                <div className='relative my-1 h-12'>
                  <div className='hair-strong absolute inset-x-0 top-1/2 h-px' />
                  <svg
                    className='absolute inset-x-0 top-1/2 h-px w-full overflow-visible'
                    preserveAspectRatio='none'
                    aria-hidden='true'
                  >
                    <line
                      x1='0'
                      y1='0'
                      x2='100%'
                      y2='0'
                      className='bp-signal'
                      stroke='var(--bp-accent)'
                      strokeWidth='1.5'
                    />
                  </svg>
                  <div className='-translate-x-1/2 -translate-y-1/2 b-accent s-panel absolute top-1/2 left-1/2 flex items-center gap-2.5 rounded-lg border px-5 py-2.5'>
                    <span className='bp-pulse s-accent h-2 w-2 rounded-full' />
                    <span className='t-ink font-semibold text-[14px]'>Zelaxy Runtime</span>
                    <span className='hair h-3.5 w-px' />
                    <span className='bp-label t-faint'>v1.0</span>
                  </div>
                </div>

                {/* bottom taps */}
                <div className='flex items-start justify-between gap-2 px-2'>
                  {INFRA.map((m) => (
                    <Chip key={m} name={m} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* registry marquee */}
        <Reveal delay={0.1}>
          <div className='b-hair relative mt-16 overflow-hidden border-y py-5'>
            <div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[color:var(--bp-bg)] to-transparent sm:w-24' />
            <div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[color:var(--bp-bg)] to-transparent sm:w-24' />
            <div className='bp-marquee flex w-max gap-3'>
              {[...REGISTRY, ...REGISTRY].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className='chip s-panel b-hair t-dim flex h-9 shrink-0 items-center rounded-full border px-4 text-[13px]'
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <p className='t-faint bp-label mt-6'>250+ integrations · MCP servers · custom tools</p>
        </Reveal>
      </div>
    </section>
  )
}
