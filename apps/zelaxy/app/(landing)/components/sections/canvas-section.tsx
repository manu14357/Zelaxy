'use client'

import { Reveal, SectionTag, Viewport } from '@/app/(landing)/components/blueprint/primitives'
import {
  type CanvasEdge,
  type CanvasNode,
  Glyph,
  type NodeKind,
  WorkflowCanvas,
} from '@/app/(landing)/components/blueprint/workflow-canvas'

const NODES: CanvasNode[] = [
  { id: 'sched', x: 0, y: 40, kind: 'trigger', label: 'Schedule', tag: 'Cron', color: '#7B68EE' },
  { id: 'hook', x: 0, y: 150, kind: 'trigger', label: 'Webhook', tag: 'Stripe', color: '#635BFF' },
  { id: 'vars', x: 0, y: 300, kind: 'memory', label: 'Variables', tag: 'State', color: '#10B981' },
  { id: 'know', x: 0, y: 410, kind: 'knowledge', label: 'Knowledge', tag: 'RAG' },
  {
    id: 'classify',
    x: 250,
    y: 60,
    kind: 'agent',
    label: 'Classifier',
    tag: 'Haiku 4.5',
    running: true,
  },
  {
    id: 'research',
    x: 250,
    y: 210,
    kind: 'agent',
    label: 'Researcher',
    tag: 'Sonnet 4.6',
    running: true,
  },
  { id: 'mcp', x: 250, y: 360, kind: 'mcp', label: 'MCP Tools', tag: 'GitHub' },
  {
    id: 'route',
    x: 500,
    y: 120,
    kind: 'decision',
    label: 'Router',
    tag: 'LLM Judge',
    running: true,
  },
  { id: 'loop', x: 500, y: 270, kind: 'loop', label: 'Loop', tag: 'forEach' },
  { id: 'vector', x: 500, y: 410, kind: 'vector', label: 'Knowledge', tag: 'pgvector' },
  { id: 'sum', x: 760, y: 60, kind: 'llm', label: 'Agent', tag: 'GPT-5.4' },
  { id: 'db', x: 760, y: 360, kind: 'db', label: 'Postgres', tag: 'Insert' },
  { id: 'deploy', x: 1010, y: 60, kind: 'deploy', label: 'Response', tag: 'API' },
  {
    id: 'observe',
    x: 1010,
    y: 200,
    kind: 'observe',
    label: 'Logs',
    tag: 'Traces',
    running: true,
  },
  { id: 'notify', x: 1010, y: 340, kind: 'email', label: 'Slack', tag: 'Send', color: '#611f69' },
]

const EDGES: CanvasEdge[] = [
  { from: 'sched', to: 'classify' },
  { from: 'hook', to: 'research' },
  { from: 'vars', to: 'research' },
  { from: 'know', to: 'research' },
  { from: 'mcp', to: 'research' },
  { from: 'classify', to: 'route' },
  { from: 'research', to: 'route' },
  { from: 'route', to: 'sum' },
  { from: 'route', to: 'loop' },
  { from: 'loop', to: 'vector' },
  { from: 'loop', to: 'db' },
  { from: 'sum', to: 'deploy' },
  { from: 'sum', to: 'observe' },
  { from: 'db', to: 'notify' },
  { from: 'vector', to: 'db' },
]

const LEGEND: { kind: NodeKind; name: string }[] = [
  { kind: 'trigger', name: 'Triggers' },
  { kind: 'agent', name: 'Agents' },
  { kind: 'llm', name: 'Models' },
  { kind: 'decision', name: 'Routing' },
  { kind: 'loop', name: 'Loops' },
  { kind: 'knowledge', name: 'Knowledge' },
  { kind: 'memory', name: 'Memory' },
  { kind: 'mcp', name: 'MCP' },
  { kind: 'vector', name: 'Vectors' },
  { kind: 'db', name: 'Data' },
  { kind: 'observe', name: 'Observe' },
  { kind: 'deploy', name: 'Deploy' },
]

export function CanvasSection() {
  return (
    <section id='canvas' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='glow-center pointer-events-none absolute inset-0' />

      <div className='relative mx-auto max-w-[1320px] px-5 sm:px-8'>
        <Reveal>
          <SectionTag id='02' name='The Canvas' coord='ZOOM 1:1 · FIT' />
        </Reveal>

        <div className='mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <Reveal>
            <h2 className='t-ink bp-display max-w-2xl font-semibold text-[clamp(2rem,5vw,3.8rem)]'>
              One canvas.
              <br />
              Every <span className='t-accent'>primitive.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className='t-dim max-w-md text-[16px] leading-relaxed'>
              Drag agents, models, memory, knowledge, MCP servers, logic and deploys onto an
              infinite canvas. Wire them together. Watch signals flow in real time.
            </p>
          </Reveal>
        </div>

        {/* The viewport */}
        <Reveal delay={0.05}>
          <div className='mt-12'>
            <Viewport label='workflow.zelaxy · main' className='overflow-hidden rounded-2xl'>
              {/* faux toolbar */}
              <div className='bp-label absolute top-0 right-0 z-20 flex items-center gap-3 px-3 py-2'>
                <span className='t-faint'>x:1180 y:500</span>
                <span className='hair h-3 w-px' />
                <span className='t-dim'>15 nodes</span>
              </div>

              {/* zoom controls */}
              <div className='b-hair s-panel absolute bottom-3 left-3 z-20 flex flex-col overflow-hidden rounded-md border'>
                {['+', '−', '⊡'].map((c) => (
                  <span
                    key={c}
                    className='t-dim b-hair grid h-7 w-7 place-items-center border-b text-sm last:border-b-0'
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* minimap */}
              <div className='b-hair s-panel absolute right-3 bottom-3 z-20 hidden h-14 w-24 rounded border sm:block'>
                <div className='bp-dot-field h-full w-full opacity-60' />
                <div className='b-accent absolute top-2 left-2 h-6 w-9 rounded-[2px] border' />
              </div>

              <div className='bp-canvas-dots relative aspect-[1205/512] w-full overflow-hidden'>
                <div className='bp-breathe absolute inset-0 flex items-center justify-center p-5'>
                  <WorkflowCanvas
                    nodes={NODES}
                    edges={EDGES}
                    viewBox='-10 22 1205 512'
                    className='h-full w-full'
                  />
                </div>
              </div>
            </Viewport>
          </div>
        </Reveal>

        {/* Node-type legend */}
        <Reveal delay={0.1}>
          <div className='b-hair mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6'>
            <span className='bp-label t-faint'>Node types</span>
            {LEGEND.map((l) => (
              <span key={l.name} className='flex items-center gap-2'>
                <svg viewBox='0 0 16 16' className='t-accent h-3.5 w-3.5'>
                  <Glyph kind={l.kind} />
                </svg>
                <span className='t-dim text-[13px]'>{l.name}</span>
              </span>
            ))}
            <span className='t-faint bp-label ml-auto'>+ 270 blocks</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
