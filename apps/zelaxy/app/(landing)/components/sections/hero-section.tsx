'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDocsUrl } from '@/lib/docs-url'
import themeImage from '@/app/(landing)/assets/theme.png'

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className='relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden'>
      {/* Background image */}
      <div className='absolute inset-0 z-0'>
        <Image
          src={themeImage}
          alt=''
          fill
          className='object-cover object-center'
          priority
          placeholder='blur'
        />
        {/* Dark overlays for readability */}
        <div className='absolute inset-0 bg-[#060606]/40' />
        <div className='absolute inset-0 bg-gradient-to-b from-[#060606]/50 via-transparent to-[#060606]' />
      </div>

      {/* Grid background overlay */}
      <div
        className='pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]'
        style={{
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)',
        }}
      />

      {/* Radial glow */}
      <div className='pointer-events-none absolute top-1/3 left-1/2 z-[1] h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl' />

      <div className='relative z-10 mx-auto max-w-4xl px-6 sm:px-8'>
        <div className='text-center'>
          {/* Badge */}
          <div
            className={`mb-8 inline-flex items-center rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-[13px] text-neutral-300 backdrop-blur-md transition-all duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <span className='mr-2.5 inline-block h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.6)]' />
            Open-Source AI Workflow Platform
            <span className='ml-2.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-medium text-[11px] text-primary'>
              v0.1.0
            </span>
          </div>

          {/* Main Heading */}
          <h1
            className={`mb-6 font-bold text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] tracking-[-0.04em] transition-all delay-150 duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <span className='text-white drop-shadow-lg'>Build. Connect.</span>
            <br />
            <span className='animate-gradient bg-[length:200%_200%] bg-gradient-to-r from-primary via-orange-400 to-amber-300 bg-clip-text text-transparent'>
              Automate with AI.
            </span>
          </h1>

          {/* Subtitle — the ONE place numbers live */}
          <p
            className={`mx-auto mb-10 max-w-xl text-[clamp(1rem,2vw,1.25rem)] text-neutral-300 leading-relaxed drop-shadow-md transition-all delay-300 duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            The visual platform to design AI-powered workflows — wire up agents, APIs, databases,
            and logic blocks on a drag-and-drop canvas, then ship automations that run themselves.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col items-center justify-center gap-3 transition-all delay-500 duration-1000 ease-out sm:flex-row sm:gap-4 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <Link href='/arena'>
              <Button
                size='lg'
                className='group h-12 rounded-full bg-white px-7 font-medium text-[15px] text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 hover:bg-neutral-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
              >
                Start Building — It&apos;s Free
                <ArrowRight className='ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5' />
              </Button>
            </Link>
            <Link href='https://github.com/manu14357/Zelaxy' target='_blank'>
              <Button
                variant='ghost'
                size='lg'
                className='h-12 rounded-full border border-white/15 bg-black/30 px-7 font-medium text-[15px] text-neutral-200 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-black/50 hover:text-white'
              >
                <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                </svg>
                Star on GitHub
              </Button>
            </Link>
            <Link href={getDocsUrl()} target='_blank'>
              <Button
                variant='ghost'
                size='lg'
                className='h-12 rounded-full border border-white/15 bg-black/30 px-7 font-medium text-[15px] text-neutral-200 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-black/50 hover:text-white'
              >
                <BookOpen className='mr-2 h-4 w-4' />
                Read the Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
