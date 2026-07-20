import type { ReactNode } from 'react'

type Tone = 'trigger' | 'logic' | 'agent' | 'tool' | 'data' | 'output'

type FlowNode = {
  /** Main label, e.g. "Agent" */
  title: string
  /** Small caption under the title, e.g. "synthesize + cite" */
  subtitle?: string
  /** Visual accent — maps to a color family */
  tone?: Tone
  /** Sub-pills shown inside the card — parallel branches or router routes */
  branches?: string[]
}

const TONES: Record<Tone, { dot: string; ring: string; text: string }> = {
  trigger: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/25 dark:ring-emerald-400/25',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  logic: {
    dot: 'bg-violet-500',
    ring: 'ring-violet-500/25 dark:ring-violet-400/25',
    text: 'text-violet-600 dark:text-violet-400',
  },
  agent: {
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/30 dark:ring-orange-400/30',
    text: 'text-orange-600 dark:text-orange-400',
  },
  tool: {
    dot: 'bg-blue-500',
    ring: 'ring-blue-500/25 dark:ring-blue-400/25',
    text: 'text-blue-600 dark:text-blue-400',
  },
  data: {
    dot: 'bg-cyan-500',
    ring: 'ring-cyan-500/25 dark:ring-cyan-400/25',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  output: {
    dot: 'bg-slate-400 dark:bg-slate-500',
    ring: 'ring-slate-400/25 dark:ring-slate-500/25',
    text: 'text-slate-600 dark:text-slate-300',
  },
}

function Arrow() {
  return (
    <div className='flex shrink-0 items-center justify-center px-0.5 text-[hsl(var(--fd-muted-foreground)/0.5)]'>
      <svg
        width='26'
        height='14'
        viewBox='0 0 26 14'
        fill='none'
        aria-hidden='true'
        className='max-sm:rotate-90'
      >
        <path
          d='M1 7h22'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinecap='round'
          strokeDasharray='0.1 4'
        />
        <path
          d='M19 2.5 24.5 7 19 11.5'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </div>
  )
}

function Node({ node }: { node: FlowNode }) {
  const tone = TONES[node.tone ?? 'output']
  return (
    <div
      className={[
        'flex min-w-[128px] max-w-[220px] flex-col gap-1 rounded-xl px-3.5 py-2.5',
        'bg-[hsl(var(--fd-card))] ring-1 ring-inset',
        tone.ring,
        'shadow-[0_1px_3px_hsl(220_13%_10%/0.05),0_1px_2px_hsl(220_13%_10%/0.04)]',
        'dark:shadow-[0_1px_3px_hsl(0_0%_0%/0.3)]',
      ].join(' ')}
    >
      <div className='flex items-center gap-2'>
        <span className={`size-2 shrink-0 rounded-full ${tone.dot}`} />
        <span className='font-semibold text-[0.8125rem] text-[hsl(var(--fd-foreground))] leading-tight'>
          {node.title}
        </span>
      </div>
      {node.subtitle && (
        <span className='pl-4 text-[0.6875rem] text-[hsl(var(--fd-muted-foreground))] leading-snug'>
          {node.subtitle}
        </span>
      )}
      {node.branches && node.branches.length > 0 && (
        <div className='mt-1.5 flex flex-col gap-1 border-[hsl(var(--fd-border))] border-t pt-1.5'>
          {node.branches.map((b) => (
            <span
              key={b}
              className={[
                'flex items-center gap-1.5 rounded-md px-2 py-1',
                'bg-[hsl(var(--fd-muted))] text-[0.6875rem] text-[hsl(var(--fd-muted-foreground))]',
              ].join(' ')}
            >
              <span className={`size-1.5 shrink-0 rounded-full ${tone.dot} opacity-70`} />
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Renders a workflow as connected node cards — a clean, readable replacement
 * for ASCII diagrams. Each node can carry `branches` (parallel work or router
 * routes) shown as sub-pills inside the card. Wraps and stacks on mobile.
 */
export function WorkflowGraph({ nodes, caption }: { nodes: FlowNode[]; caption?: ReactNode }) {
  return (
    <figure className='my-6 overflow-x-auto rounded-2xl border border-[hsl(var(--fd-border))] bg-[hsl(var(--fd-muted)/0.4)] px-4 py-5'>
      <div className='flex min-w-fit flex-row flex-wrap items-center justify-center gap-y-3 max-sm:flex-col'>
        {nodes.map((node, i) => (
          <div key={`${node.title}-${i}`} className='flex items-center max-sm:flex-col'>
            <Node node={node} />
            {i < nodes.length - 1 && <Arrow />}
          </div>
        ))}
      </div>
      {caption && (
        <figcaption className='mt-4 text-center text-[0.75rem] text-[hsl(var(--fd-muted-foreground))] italic'>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
