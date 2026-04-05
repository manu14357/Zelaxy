'use client'

import { useEffect, useRef, useState } from 'react'

const steps = [
  {
    number: '01',
    title: 'Drag blocks onto the canvas',
    description:
      'Choose from AI agents, integrations, databases, and logic blocks. Place them on an infinite canvas.',
  },
  {
    number: '02',
    title: 'Wire the connections',
    description:
      'Connect blocks visually to define data flow. Add conditions, loops, routers, and parallel branches.',
  },
  {
    number: '03',
    title: 'Execute in real-time',
    description:
      'Run with one click. Watch token-by-token streaming, inspect every output, and debug live.',
  },
  {
    number: '04',
    title: 'Automate everything',
    description:
      'Trigger via webhooks, cron schedules, or API calls. Your workflows run autonomously.',
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
    <section ref={sectionRef} id='how-it-works' className='relative bg-white py-28 dark:bg-[#060606] sm:py-36'>
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
            How it works
          </p>
          <h2
            className={`max-w-md font-bold text-[clamp(1.75rem,4vw,3rem)] text-neutral-900 leading-[1.1] tracking-[-0.03em] transition-all delay-100 duration-700 dark:text-white ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            From idea to automation in minutes.
          </h2>
        </div>

        {/* Steps - Vertical timeline, not cards */}
        <div className='relative'>
          {/* Vertical line */}
          <div className='absolute top-0 bottom-0 left-[23px] w-px bg-gradient-to-b from-orange-500/30 via-neutral-200 to-transparent dark:via-white/[0.06] sm:left-[31px]' />

          <div className='space-y-16 sm:space-y-20'>
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`relative flex gap-8 sm:gap-12 transition-all duration-700 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${200 + index * 150}ms` }}
              >
                {/* Number circle */}
                <div className='relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 dark:border-white/[0.08] dark:bg-[#0a0a0b] sm:h-16 sm:w-16'>
                  <span className='font-mono text-[13px] text-neutral-500 sm:text-sm'>{step.number}</span>
                </div>

                {/* Content */}
                <div className='pt-1 sm:pt-3'>
                  <h3 className='mb-2 font-semibold text-lg text-neutral-900 tracking-[-0.01em] dark:text-white sm:text-xl'>
                    {step.title}
                  </h3>
                  <p className='max-w-md text-[15px] text-neutral-500 leading-relaxed sm:text-base'>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
