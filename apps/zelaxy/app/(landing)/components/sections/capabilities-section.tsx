'use client'

import { Reveal, SectionTag } from '@/app/(landing)/components/blueprint/primitives'
import { Glyph, type NodeKind } from '@/app/(landing)/components/blueprint/workflow-canvas'

const CAPS: { kind: NodeKind; name: string; spec: string }[] = [
  { kind: 'agent', name: 'Agent Block', spec: 'LLM agents with tool use and structured output.' },
  { kind: 'trigger', name: 'Visual Canvas', spec: 'Infinite React Flow surface, drag & drop.' },
  { kind: 'loop', name: 'Workflow Engine', spec: 'DAG executor with loops and parallel branches.' },
  { kind: 'llm', name: 'AI Copilot', spec: 'The Wand builds workflows from a prompt.' },
  { kind: 'knowledge', name: 'Knowledge & RAG', spec: 'pgvector search over your documents.' },
  { kind: 'mcp', name: 'MCP Native', spec: 'Connect any MCP server as live tools.' },
  { kind: 'memory', name: 'Memory', spec: 'Persistent storage across runs and sessions.' },
  { kind: 'decision', name: 'Routing & Logic', spec: 'Router, Condition, Loop, Parallel, Switch.' },
  { kind: 'output', name: 'ZelaxyArena', spec: 'Streaming chat engine with tool calls & cost.' },
  {
    kind: 'observe',
    name: 'Human in the Loop',
    spec: 'Pause for review or approval, then resume.',
  },
  { kind: 'vector', name: 'Guardrails', spec: 'Schema, regex, PII and hallucination checks.' },
  { kind: 'db', name: 'Tables & Files', spec: 'Built-in data tables and file storage.' },
  { kind: 'trigger', name: 'Triggers & Schedules', spec: 'Webhooks, cron, chat and manual runs.' },
  { kind: 'deploy', name: 'Deployments', spec: 'Ship as API, chat, or webhook endpoint.' },
  { kind: 'email', name: 'Observability', spec: 'Logs with trace spans, tool calls and cost.' },
  { kind: 'agent', name: 'Collaboration', spec: 'Real-time multiplayer editing via Socket.IO.' },
]

export function CapabilitiesSection() {
  return (
    <section id='capabilities' className='s-bg relative py-28 sm:py-36'>
      <div className='hair absolute inset-x-0 top-0 h-px' />
      <div className='mx-auto max-w-[1320px] px-5 sm:px-8'>
        <Reveal>
          <SectionTag id='04' name='Capabilities' coord='REGISTER · 16 SYS' />
        </Reveal>

        <div className='mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
          <Reveal>
            <h2 className='t-ink bp-display max-w-xl font-semibold text-[clamp(2rem,5vw,3.8rem)]'>
              A complete
              <br />
              <span className='t-accent'>operating system.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className='t-dim max-w-md text-[16px] leading-relaxed'>
              Not a feature list — a coherent system. Every primitive a production AI team needs, on
              one surface, speaking one runtime.
            </p>
          </Reveal>
        </div>

        {/* register grid */}
        <Reveal delay={0.05}>
          <div className='b-hair mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4'>
            {CAPS.map((c, i) => (
              <div key={c.name} className='cap-cell s-panel relative p-6'>
                <div className='mb-5 flex items-center justify-between'>
                  <span className='cap-idx bp-label t-faint'>{String(i + 1).padStart(2, '0')}</span>
                  <svg viewBox='0 0 16 16' className='t-dim h-4 w-4'>
                    <Glyph kind={c.kind} />
                  </svg>
                </div>
                <h3 className='cap-name t-ink font-semibold text-[15px] tracking-[-0.01em]'>
                  {c.name}
                </h3>
                <p className='t-dim mt-2 text-[13px] leading-relaxed'>{c.spec}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
