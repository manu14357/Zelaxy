'use client'

import { Coffee, Heart, Rocket } from 'lucide-react'

export function DeveloperSection() {
  return (
    <section className='relative bg-[#050505] py-24 sm:py-32'>
      {/* Subtle top divider */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent' />

      <div className='mx-auto max-w-2xl px-6 sm:px-8'>
        <div className='flex flex-col items-center text-center'>
          {/* Badge */}
          <span className='mb-12 font-semibold text-[13px] text-primary uppercase tracking-[0.2em]'>
            Meet the Creator
          </span>

          {/* Name */}
          <h3 className='mb-1.5 font-bold text-white text-xl tracking-[-0.01em]'>Manohar Choppa</h3>
          <p className='mb-1 font-medium text-[15px] text-primary'>Developer</p>
          <p className='mb-4 text-[13px] text-neutral-500'>B.Tech CSE (AI &amp; ML)</p>

          {/* Gen Z Badge */}
          <span className='mb-10 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-neutral-400 backdrop-blur-sm'>
            <Rocket className='h-3 w-3' />
            Gen Z Builder
          </span>

          {/* Story */}
          <div className='space-y-5 text-[16px] text-neutral-500 leading-[1.7]'>
            <p>
              Hey there! I&apos;m Manohar, a B.Tech graduate in Computer Science with specialization
              in AI &amp; ML, and the solo developer behind Zelaxy.
            </p>

            <p>
              Zelaxy started as a hobby project — built through countless late nights, coffee shops,
              and wherever inspiration struck. Every line of code was written with one goal: helping
              people automate smarter.
            </p>

            <h4 className='pt-1 font-semibold text-[17px] text-neutral-300 tracking-[-0.01em]'>
              Why Zelaxy?
            </h4>

            <p>
              Most automation tools are either too complex or too limited. I wanted to build
              something different — a platform where anyone can visually create AI-powered workflows
              with 80+ integrations, right out of the box.
            </p>

            <p className='text-neutral-600 italic'>
              More than just a tool — it&apos;s built for ambitious people who want to work smarter.
              Made with <Heart className='inline h-3.5 w-3.5 fill-red-500 text-red-500' /> and lots
              of <Coffee className='inline h-3.5 w-3.5 text-amber-600' />
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
