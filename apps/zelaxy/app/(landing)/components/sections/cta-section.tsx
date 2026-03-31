'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDocsUrl } from '@/lib/docs-url'

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className='relative bg-[#060606] py-24'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div
          className={`relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] px-8 py-16 text-center sm:px-16 sm:py-20 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          } transition-all duration-700`}
        >
          {/* Ambient glow */}
          <div className='-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2 h-64 w-64 rounded-full bg-primary/10 blur-[100px]' />
          <div className='absolute right-0 bottom-0 h-48 w-48 translate-x-1/2 translate-y-1/2 rounded-full bg-primary/5 blur-[80px]' />

          <div className='relative'>
            <h2 className='mb-4 font-bold text-3xl text-white tracking-[-0.03em] sm:text-4xl'>
              Ready to automate?
            </h2>
            <p className='mx-auto mb-10 max-w-lg text-lg text-neutral-500'>
              Join the developers building smarter workflows. Open source, free forever.
            </p>

            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Link href='/arena'>
                <Button
                  size='lg'
                  className='group rounded-full bg-white px-8 py-6 text-[#060606] text-base shadow-lg shadow-white/5 transition-all duration-300 hover:bg-neutral-200 hover:shadow-xl'
                >
                  Get Started Free
                  <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                </Button>
              </Link>
              <Link href={getDocsUrl()}>
                <Button
                  variant='ghost'
                  size='lg'
                  className='rounded-full px-8 py-6 text-base text-neutral-500 transition-all duration-300 hover:bg-white/[0.04] hover:text-white'
                >
                  Read the Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
