'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpen, Github, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDocsUrl } from '@/lib/docs-url'
import themeImage from '@/app/(landing)/assets/theme.png'

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Animated particle network on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; o: number }
    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      o: Math.random() * 0.4 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249,115,22,${p.o})`
        ctx.fill()
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(249,115,22,${0.06 * (1 - dist / 120)})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden'>
      {/* Theme bg image */}
      <div className='absolute inset-0 z-0'>
        <Image
          src={themeImage}
          alt=''
          fill
          className='object-cover object-center opacity-30'
          priority
          placeholder='blur'
        />
        <div className='absolute inset-0 bg-gradient-to-b from-[#050507]/70 via-[#050507]/40 to-[#050507]' />
      </div>

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className='pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-60'
      />

      {/* Mesh grid */}
      <div
        className='pointer-events-none absolute inset-0 z-[2]'
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 40%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 65% at 50% 40%, black 30%, transparent 100%)',
        }}
      />

      {/* Central radial bloom */}
      <div className='-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-[30%] left-1/2 z-[2] h-[700px] w-[700px] rounded-full bg-orange-500/[0.07] blur-[140px]' />
      <div className='-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-[35%] left-1/2 z-[2] h-[300px] w-[500px] rounded-full bg-amber-400/[0.05] blur-[80px]' />

      {/* Content */}
      <div className='relative z-10 mx-auto w-full max-w-5xl px-6 sm:px-8'>
        <div className='flex flex-col items-center text-center'>
          {/* Top badge */}
          <div
            className={`mb-8 inline-flex items-center gap-2.5 rounded-full border border-orange-500/25 bg-orange-500/[0.08] px-4 py-2 text-[13px] backdrop-blur-md transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <Sparkles className='h-3.5 w-3.5 text-orange-400' />
            <span className='font-medium text-orange-300'>Open-Source AI Workflow Platform</span>
            <span className='h-3.5 w-px bg-orange-500/30' />
            <span className='rounded-full bg-orange-500/20 px-2 py-0.5 font-mono text-[11px] text-orange-400'>
              v0.1.0
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`mb-6 font-black text-[clamp(2.6rem,8vw,6rem)] leading-[0.95] tracking-[-0.05em] transition-all delay-100 duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <span className='block text-white'>Build. Connect.</span>
            <span className='block animate-gradient bg-[length:300%_300%] bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent'>
              Automate with AI.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`mx-auto mb-10 max-w-2xl text-[clamp(1rem,2vw,1.2rem)] text-neutral-400 leading-relaxed transition-all delay-200 duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            The visual platform to design AI-powered workflows — wire up agents, APIs, databases,
            and logic blocks on a drag-and-drop canvas, then ship automations that run themselves.
          </p>

          {/* CTA row */}
          <div
            className={`flex flex-wrap items-center justify-center gap-3 transition-all delay-300 duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <Button
              asChild
              size='lg'
              className='group relative h-12 overflow-hidden rounded-full bg-gradient-to-br from-orange-500 to-amber-400 px-8 font-semibold text-[15px] text-white shadow-[0_0_32px_rgba(249,115,22,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_52px_rgba(249,115,22,0.7),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98]'
            >
              <Link href='/signup'>
                Start Building — Free
                <ArrowRight className='ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1' />
              </Link>
            </Button>

            <Button
              asChild
              variant='ghost'
              size='lg'
              className='h-12 rounded-full border border-white/[0.15] bg-white/[0.06] px-7 font-medium text-[15px] text-neutral-200 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/[0.11] hover:text-white active:scale-[0.98]'
            >
              <Link href='/login'>Sign In</Link>
            </Button>
          </div>

          {/* Secondary links */}
          <div
            className={`mt-6 flex flex-wrap items-center justify-center gap-2.5 transition-all delay-500 duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <Link
              href='https://github.com/manu14357/Zelaxy'
              target='_blank'
              rel='noopener noreferrer'
              className='group flex h-9 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 font-medium text-[13px] text-neutral-400 transition-all duration-200 hover:border-orange-500/50 hover:bg-orange-500/[0.08] hover:text-orange-300'
            >
              <Github className='h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110 group-hover:text-orange-400' />
              Star on GitHub
            </Link>
            <span className='h-3.5 w-px bg-white/[0.10]' />
            <Link
              href={getDocsUrl()}
              target='_blank'
              rel='noopener noreferrer'
              className='group flex h-9 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 font-medium text-[13px] text-neutral-400 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white'
            >
              <BookOpen className='h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110' />
              Read the Docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
