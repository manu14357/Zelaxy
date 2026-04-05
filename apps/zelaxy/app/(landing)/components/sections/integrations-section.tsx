'use client'

import { useEffect, useRef, useState } from 'react'

const integrations = [
  'OpenAI',
  'Claude',
  'Gemini',
  'DeepSeek',
  'Grok',
  'Groq',
  'Cerebras',
  'Slack',
  'GitHub',
  'Gmail',
  'Notion',
  'Jira',
  'Stripe',
  'Google Drive',
  'Microsoft 365',
  'Supabase',
  'Pinecone',
  'Snowflake',
  'S3',
  'Twilio',
  'Telegram',
  'Discord',
  'Airtable',
  'HubSpot',
  'Ollama',
  'Azure OpenAI',
  'OpenRouter',
  'PostgreSQL',
  'Redis',
]

// Split into two rows for marquee
const row1 = integrations.slice(0, Math.ceil(integrations.length / 2))
const row2 = integrations.slice(Math.ceil(integrations.length / 2))

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  // Triple the items for seamless loop
  const tripled = [...items, ...items, ...items]

  return (
    <div className='relative overflow-hidden'>
      {/* Edge fades */}
      <div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent sm:w-40 dark:from-[#060606]' />
      <div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent sm:w-40 dark:from-[#060606]' />

      <div
        className={`flex gap-3 sm:gap-4 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ width: 'max-content' }}
      >
        {tripled.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className='flex h-10 shrink-0 items-center rounded-full border border-neutral-200 bg-neutral-50 px-5 text-[13px] text-neutral-500 transition-colors duration-300 hover:border-neutral-300 hover:text-neutral-700 sm:h-11 sm:px-6 sm:text-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12] dark:hover:text-neutral-300'
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  )
}

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true)
        })
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id='integrations'
      className='relative bg-white py-28 sm:py-36 dark:bg-[#060606]'
    >
      {/* Top divider */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-white/[0.06]' />

      {/* Header */}
      <div className='mx-auto max-w-5xl px-6 lg:px-8'>
        <div
          className={`mb-16 text-center transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <p className='mb-4 font-mono text-[13px] text-orange-400/80 uppercase tracking-widest'>
            Integrations
          </p>
          <h2 className='font-bold text-[clamp(1.75rem,4vw,3rem)] text-neutral-900 leading-[1.1] tracking-[-0.03em] dark:text-white'>
            Connects to everything.
          </h2>
        </div>
      </div>

      {/* Marquee rows */}
      <div
        className={`space-y-3 transition-all delay-200 duration-700 sm:space-y-4 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <MarqueeRow items={row1} />
        <MarqueeRow items={row2} reverse />
      </div>
    </section>
  )
}
