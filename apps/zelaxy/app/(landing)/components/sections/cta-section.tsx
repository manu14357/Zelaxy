'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true)
        })
      },
      { threshold: 0.15 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className='relative bg-white py-28 sm:py-36 dark:bg-[#060606]'>
      {/* Top divider */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-white/[0.06]' />

      {/* Ambient glow */}
      <div className='-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] rounded-full bg-orange-500/[0.04] blur-[140px]' />

      <div className='relative mx-auto max-w-3xl px-6 text-center lg:px-8'>
        {/* Open source badge */}
        <div
          className={`mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-1.5 text-[13px] transition-all duration-700 dark:border-white/[0.08] dark:bg-white/[0.03] ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
          <span className='text-neutral-500 dark:text-neutral-400'>
            Open source &middot; MIT licensed
          </span>
        </div>

        {/* Headline */}
        <h2
          className={`mb-6 font-bold text-[clamp(2rem,5vw,3.5rem)] text-neutral-900 leading-[1.1] tracking-[-0.03em] transition-all delay-100 duration-700 dark:text-white ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          Start building today.
        </h2>

        <p
          className={`mx-auto mb-10 max-w-md text-lg text-neutral-500 leading-relaxed transition-all delay-200 duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          Free to use. Deploy anywhere. Join the community building the future of AI automation.
        </p>

        {/* CTA buttons */}
        <div
          className={`flex flex-col items-center gap-3 transition-all delay-300 duration-700 sm:flex-row sm:justify-center ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <Button
            asChild
            size='lg'
            className='group h-12 w-full rounded-full bg-neutral-900 px-8 font-medium text-[15px] text-white transition-all duration-300 hover:bg-neutral-800 active:scale-[0.98] sm:w-auto dark:bg-white dark:text-black dark:hover:bg-neutral-200'
          >
            <Link href='/signup'>
              Get Started Free
              <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5' />
            </Link>
          </Button>

          <Button
            asChild
            variant='ghost'
            size='lg'
            className='h-12 w-full rounded-full border border-neutral-300 bg-transparent px-7 font-medium text-[15px] text-neutral-600 transition-all duration-300 hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.98] sm:w-auto dark:border-white/[0.1] dark:text-neutral-300 dark:hover:border-white/[0.2] dark:hover:bg-white/[0.05] dark:hover:text-white'
          >
            <Link
              href='https://github.com/manu14357/Zelaxy'
              target='_blank'
              rel='noopener noreferrer'
            >
              Star on GitHub
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
