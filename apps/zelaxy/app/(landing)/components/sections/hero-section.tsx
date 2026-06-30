'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Viewport } from '@/app/(landing)/components/blueprint/primitives'
import { TerminalLog } from '@/app/(landing)/components/blueprint/terminal-log'
import {
  type CanvasEdge,
  type CanvasNode,
  WorkflowCanvas,
} from '@/app/(landing)/components/blueprint/workflow-canvas'

const GITHUB_REPO = 'manu14357/Zelaxy'

const NODES: CanvasNode[] = [
  { id: 'trigger', x: 8, y: 24, kind: 'trigger', label: 'Webhook', tag: 'Gmail', color: '#10B981' },
  { id: 'mcp', x: 8, y: 108, kind: 'mcp', label: 'MCP Tools', tag: 'Servers' },
  { id: 'knowledge', x: 8, y: 192, kind: 'knowledge', label: 'Knowledge', tag: 'RAG' },
  { id: 'memory', x: 8, y: 276, kind: 'memory', label: 'Memory', tag: 'Vector' },
  {
    id: 'agent',
    x: 214,
    y: 150,
    kind: 'agent',
    label: 'Agent',
    tag: 'Opus 4.8',
    running: true,
  },
  {
    id: 'route',
    x: 418,
    y: 56,
    kind: 'decision',
    label: 'Router',
    tag: 'LLM Judge',
    running: true,
  },
  { id: 'deploy', x: 418, y: 150, kind: 'deploy', label: 'Response', tag: 'API' },
  { id: 'notify', x: 418, y: 244, kind: 'email', label: 'Slack', tag: 'Send', color: '#611f69' },
]

const EDGES: CanvasEdge[] = [
  { from: 'trigger', to: 'agent', dashDelay: 0 },
  { from: 'mcp', to: 'agent', dashDelay: 0.3 },
  { from: 'knowledge', to: 'agent', dashDelay: 0.6 },
  { from: 'memory', to: 'agent', dashDelay: 0.9 },
  { from: 'agent', to: 'route', dashDelay: 1.1 },
  { from: 'route', to: 'deploy', dashDelay: 1.4 },
  { from: 'route', to: 'notify', dashDelay: 1.6 },
]

const SPECS = ['LLM-agnostic', 'MCP-native', 'Local + Cloud', 'API-first', 'Open source']

export function HeroSection() {
  const reduce = useReducedMotion()
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then((r) => r.json())
      .then((d) => typeof d.stargazers_count === 'number' && setStars(d.stargazers_count))
      .catch(() => {})
  }, [])

  const ease = [0.16, 1, 0.3, 1] as const
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease },
  })

  return (
    <section className='s-bg hero-section relative overflow-hidden pb-20'>
      {/* engineering grid + accent wash */}
      <div className='bp-grid-field pointer-events-none absolute inset-0 opacity-70' />
      <div className='glow-tr pointer-events-none absolute inset-0' />
      {/* axis ticks down the left edge */}
      <div className='hair pointer-events-none absolute top-0 bottom-0 left-6 hidden w-px lg:block' />

      <div className='relative mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10'>
        {/* ---------- Text column ---------- */}
        <div>
          <motion.div {...rise(0)} className='bp-label mb-7 flex items-center gap-3'>
            <span className='bp-blink s-accent h-1.5 w-1.5 rounded-full' />
            <span className='t-accent'>System online</span>
            <span className='hair h-px w-8' />
            <span className='t-faint'>The OS for AI work</span>
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className='t-ink bp-display font-semibold text-[clamp(2.7rem,7.2vw,5.4rem)]'
          >
            Where AI systems
            <br />
            are <span className='t-accent bp-glow'>built.</span>
          </motion.h1>

          <motion.p {...rise(0.18)} className='t-dim mt-7 max-w-xl text-[17px] leading-relaxed'>
            Zelaxy is the visual operating system for AI work — compose agents, workflows,
            automations, reasoning and knowledge on one canvas, then deploy to production.
          </motion.p>

          <motion.div {...rise(0.26)} className='mt-9 flex flex-wrap items-center gap-3'>
            <Link
              href='/arena'
              className='btn-accent group inline-flex h-12 items-center gap-2 rounded-lg px-7 font-medium text-[15px]'
            >
              Start Building
              <span className='transition-transform group-hover:translate-x-0.5'>→</span>
            </Link>
            <a
              href='#canvas'
              className='btn-ghost inline-flex h-12 items-center rounded-lg px-6 font-medium text-[15px]'
            >
              View the Canvas
            </a>
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target='_blank'
              rel='noopener noreferrer'
              className='t-dim hover-ink inline-flex h-12 items-center gap-2 px-2 font-blueprint text-[13px]'
            >
              <GitHubMark />
              {stars !== null ? `★ ${stars.toLocaleString()}` : 'GitHub'}
            </a>
          </motion.div>

          <motion.div
            {...rise(0.34)}
            className='b-hair mt-11 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-6'
          >
            {SPECS.map((s, i) => (
              <span key={s} className='flex items-center gap-3'>
                {i > 0 && <span className='t-faint'>/</span>}
                <span className='bp-label t-dim'>{s}</span>
              </span>
            ))}
          </motion.div>
        </div>

        {/* ---------- Live canvas viewport ---------- */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease }}
          className='relative'
        >
          <Viewport label='Canvas · runtime' className='overflow-hidden rounded-xl'>
            {/* status chip */}
            <div className='bp-label absolute top-0 right-0 z-20 flex items-center gap-2 px-3 py-2'>
              <span className='bp-pulse s-accent h-1.5 w-1.5 rounded-full' />
              <span className='t-dim'>Running</span>
              <span className='t-faint'>· 1.28s</span>
            </div>

            <div className='bp-canvas-dots relative aspect-[16/12] w-full'>
              <div className='bp-breathe absolute inset-0 flex items-center justify-center p-4'>
                <WorkflowCanvas
                  nodes={NODES}
                  edges={EDGES}
                  viewBox='0 0 600 360'
                  className='h-full w-full'
                />
              </div>
            </div>

            {/* inspector / execution log */}
            <div className='b-hair s-panel border-t px-4 py-3'>
              <div className='bp-label mb-2 flex items-center justify-between'>
                <span className='t-faint'>Execution log</span>
                <span className='t-faint'>run #4821</span>
              </div>
              <TerminalLog />
            </div>
          </Viewport>

          {/* dimension annotation */}
          <div className='bp-label mt-3 flex items-center justify-between'>
            <span className='t-faint'>fig.00 — agent runtime graph</span>
            <span className='t-faint'>8 nodes · 7 edges</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function GitHubMark() {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' className='h-4 w-4' aria-hidden='true'>
      <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' />
    </svg>
  )
}
