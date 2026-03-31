'use client'

import { useEffect, useRef, useState } from 'react'
import { GitBranch, MousePointerClick, Play, Zap } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: MousePointerClick,
    title: 'Drag & drop blocks',
    description:
      'Choose from a massive library of blocks — AI agents, tool integrations, databases, and logic — then place them on the canvas.',
    color: 'orange',
  },
  {
    number: '02',
    icon: GitBranch,
    title: 'Connect the flow',
    description:
      'Wire blocks together to define your workflow. Add conditions, loops (forEach & for), AI-powered routers, and parallel branches — all visually.',
    color: 'orange',
  },
  {
    number: '03',
    icon: Play,
    title: 'Execute & monitor',
    description:
      'Run with one click. Watch token-by-token streaming in real-time, inspect outputs at every block, or trigger via webhooks and cron schedules.',
    color: 'orange',
  },
  {
    number: '04',
    icon: Zap,
    title: 'Scale & automate',
    description:
      'Trigger workflows from webhooks, schedule with cron, compose sub-workflows, and let your AI agents decide which tools to call.',
    color: 'orange',
  },
]

export function HowItWorksSection() {
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
    <section ref={sectionRef} id='how-it-works' className='relative bg-[#050505] py-28 sm:py-36'>
      {/* Orange accent line at top */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent' />

      {/* Ambient background glow */}
      <div className='pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-orange-500/[0.03] blur-[120px]' />

      <div className='mx-auto max-w-6xl px-6 sm:px-8'>
        {/* Header */}
        <div className='mb-20 text-center'>
          <p
            className={`mb-5 font-semibold text-[13px] text-orange-500 uppercase tracking-[0.2em] transition-all duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            How It Works
          </p>
          <h2
            className={`mb-5 font-bold text-[clamp(1.75rem,4vw,3rem)] text-white leading-[1.15] tracking-[-0.03em] transition-all delay-100 duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            Four steps to <span className='text-gradient-apple'>infinite automations.</span>
          </h2>
          <p
            className={`mx-auto max-w-lg text-[17px] text-neutral-400 leading-relaxed transition-all delay-200 duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            Go from idea to running workflow in minutes — no code required.
          </p>
        </div>

        {/* Steps */}
        <div className='relative'>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5'>
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className={`group relative transition-all duration-1000 ease-out ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                  }`}
                  style={{ transitionDelay: `${300 + index * 150}ms` }}
                >
                  {/* Card */}
                  <div className='hover:-translate-y-1.5 relative overflow-hidden rounded-2xl border border-orange-500/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 transition-all duration-500 hover:border-orange-500/20 hover:shadow-[0_8px_40px_rgba(249,115,22,0.08)]'>
                    {/* Top orange glow on hover */}
                    <div className='pointer-events-none absolute inset-x-0 -top-20 h-40 rounded-full bg-orange-500/[0.00] blur-3xl transition-all duration-700 group-hover:bg-orange-500/[0.06]' />

                    {/* Step number */}
                    <span className='relative mb-6 block font-bold text-[52px] leading-none tracking-tight text-orange-500/[0.08] transition-colors duration-500 group-hover:text-orange-500/[0.15]'>
                      {step.number}
                    </span>

                    {/* Icon badge */}
                    <div className='mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20 transition-all duration-500 group-hover:bg-orange-500/15 group-hover:ring-orange-500/30 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]'>
                      <Icon className='h-5 w-5 text-orange-400' />
                    </div>

                    {/* Text */}
                    <h3 className='mb-3 font-semibold text-lg text-white tracking-[-0.01em]'>
                      {step.title}
                    </h3>
                    <p className='text-[15px] text-neutral-500 leading-relaxed'>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
