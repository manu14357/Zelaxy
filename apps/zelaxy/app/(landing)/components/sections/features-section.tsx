'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Eye, GitBranch, Brain, Zap, Shield } from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'Multi-Provider AI',
    description:
      'OpenAI, Claude, Gemini, DeepSeek, Grok, Groq, Cerebras, Ollama and more. Tool calling, structured output, and fallback models built in.',
  },
  {
    icon: Eye,
    title: 'Real-Time Streaming',
    description:
      'Watch workflows execute token-by-token. Inspect every block output and debug live as data flows through the pipeline.',
  },
  {
    icon: GitBranch,
    title: 'Smart Routing',
    description:
      'AI-powered routing with up to 4 paths. LLM-as-Judge for subjective decisions. forEach loops and parallel branches.',
  },
  {
    icon: Brain,
    title: 'Knowledge & RAG',
    description:
      'Built-in RAG pipeline with pgvector for document search. Persistent conversation history across workflow sessions.',
  },
  {
    icon: Zap,
    title: 'Event-Driven Triggers',
    description:
      'Webhooks from Gmail, Slack, GitHub, Stripe, Telegram, and more. Plus cron schedules and manual triggers.',
  },
  {
    icon: Shield,
    title: 'Guardrails',
    description:
      'Content validation with JSON schema, regex, PII detection, and hallucination checking. Quality gates before proceeding.',
  },
]

export function FeaturesSection() {
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
    <section ref={sectionRef} id='features' className='relative bg-white py-28 dark:bg-[#060606] sm:py-36'>
      {/* Top divider */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-white/[0.06]' />

      <div className='mx-auto max-w-5xl px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-20'>
          <p
            className={`mb-4 font-mono text-[13px] text-orange-400/80 uppercase tracking-widest transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            Features
          </p>
          <h2
            className={`max-w-lg font-bold text-[clamp(1.75rem,4vw,3rem)] text-neutral-900 leading-[1.1] tracking-[-0.03em] transition-all delay-100 duration-700 dark:text-white ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            Everything to{' '}
            <span className='text-gradient-apple'>automate anything.</span>
          </h2>
        </div>

        {/* Features list - Alternating full-width rows, not cards */}
        <div className='space-y-0'>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`group flex items-start gap-6 border-neutral-200 border-t py-10 transition-all duration-700 first:border-t-0 dark:border-white/[0.04] sm:gap-10 sm:py-12 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                {/* Icon */}
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 transition-colors duration-300 group-hover:border-orange-500/20 group-hover:bg-orange-500/[0.06] dark:border-white/[0.06] dark:bg-white/[0.02] sm:h-12 sm:w-12'>
                  <Icon className='h-4 w-4 text-neutral-500 transition-colors duration-300 group-hover:text-orange-400 sm:h-5 sm:w-5' />
                </div>

                {/* Text */}
                <div className='min-w-0'>
                  <h3 className='mb-1.5 font-semibold text-neutral-900 tracking-[-0.01em] dark:text-white sm:text-lg'>
                    {feature.title}
                  </h3>
                  <p className='max-w-xl text-[15px] text-neutral-500 leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
