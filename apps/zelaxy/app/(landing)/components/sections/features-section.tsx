'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Brain, Eye, GitBranch, Puzzle, Shield, Sparkles, Workflow, Zap } from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'Multi-Provider AI Agents',
    description:
      'Built-in support for OpenAI, Claude, Gemini, DeepSeek, Grok, Groq, Cerebras, Azure OpenAI, OpenRouter, and Ollama. Tool calling, structured JSON output, and fallback models.',
    span: 'sm:col-span-2',
    highlight: true,
  },
  {
    icon: Workflow,
    title: 'Visual Flow Builder',
    description:
      'Drag-and-drop canvas with topological sorting execution. Connect blocks visually, define data flow with {{variables}}, and compose sub-workflows.',
    span: '',
    highlight: false,
  },
  {
    icon: Zap,
    title: 'Event-Driven Triggers',
    description:
      'Webhooks from Gmail, Slack, GitHub, Stripe, Telegram, and more. Plus cron schedules and manual triggers.',
    span: '',
    highlight: false,
  },
  {
    icon: Eye,
    title: 'Real-Time Streaming',
    description:
      'Token-by-token LLM streaming. Watch workflows execute live — inspect every block output, monitor state, and debug in real-time.',
    span: '',
    highlight: false,
  },
  {
    icon: Brain,
    title: 'Knowledge & Memory',
    description:
      'RAG pipeline with pgvector for document search. Persistent conversation history and key-value storage across workflow sessions.',
    span: '',
    highlight: false,
  },
  {
    icon: GitBranch,
    title: 'Smart Routing & Logic',
    description:
      'AI-powered routing with up to 4 paths. LLM-as-Judge conditions for subjective decisions. forEach/for loops and parallel execution branches.',
    span: 'sm:col-span-2',
    highlight: true,
  },
  {
    icon: Shield,
    title: 'Guardrails & Evaluation',
    description:
      'Content validation with JSON schema, regex, PII detection, and hallucination checking. Quality gates that score content 1-10 before proceeding.',
    span: '',
    highlight: false,
  },
  {
    icon: Sparkles,
    title: 'Agie AI Copilot',
    description:
      'Built-in AI copilot that generates system prompts, code, and JSON schemas from natural language descriptions. Ask and it builds.',
    span: '',
    highlight: false,
  },
  {
    icon: Puzzle,
    title: 'Deep Integrations',
    description:
      'Slack, GitHub, Google Workspace, Microsoft 365, Notion, Jira, Supabase, Pinecone, Snowflake, S3, Twilio, and dozens more — out of the box.',
    span: 'sm:col-span-2',
    highlight: true,
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
    <section ref={sectionRef} id='features' className='relative bg-[#060606] py-28 sm:py-36'>
      {/* Orange accent divider */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent' />

      {/* Ambient glow */}
      <div className='pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-orange-500/[0.03] blur-[120px]' />

      <div className='mx-auto max-w-6xl px-6 sm:px-8'>
        {/* Header */}
        <div className='mb-20 text-center'>
          <p
            className={`mb-5 font-semibold text-[13px] text-orange-500 uppercase tracking-[0.2em] transition-all duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            Features
          </p>
          <h2
            className={`mb-5 font-bold text-[clamp(1.75rem,4vw,3rem)] text-white leading-[1.15] tracking-[-0.03em] transition-all delay-100 duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            Everything to <span className='text-gradient-apple'>automate anything.</span>
          </h2>
          <p
            className={`mx-auto max-w-lg text-[17px] text-neutral-400 leading-relaxed transition-all delay-200 duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            From simple automations to complex AI-driven pipelines — every building block you need.
          </p>
        </div>

        {/* Bento-style Features Grid */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group hover:-translate-y-1 relative overflow-hidden rounded-2xl border p-8 transition-all duration-700 ease-out ${feature.span} ${
                  feature.highlight
                    ? 'border-orange-500/[0.12] bg-gradient-to-br from-orange-500/[0.06] via-white/[0.02] to-transparent hover:border-orange-500/25 hover:shadow-[0_8px_40px_rgba(249,115,22,0.1)]'
                    : 'border-orange-500/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:border-orange-500/15 hover:shadow-[0_8px_30px_rgba(249,115,22,0.06)]'
                } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                style={{ transitionDelay: `${300 + index * 80}ms` }}
              >
                {/* Hover glow */}
                <div className='pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
                  <div className='absolute -top-16 -right-16 h-40 w-40 rounded-full bg-orange-500/[0.06] blur-3xl' />
                </div>

                <div className='relative'>
                  {/* Icon */}
                  <div className='mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20 transition-all duration-500 group-hover:bg-orange-500/15 group-hover:ring-orange-500/30 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]'>
                    <Icon className='h-5 w-5 text-orange-400' />
                  </div>

                  <h3 className='mb-2.5 font-semibold text-[17px] text-white tracking-[-0.01em]'>
                    {feature.title}
                  </h3>
                  <p className='text-[15px] text-neutral-500 leading-relaxed'>
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
