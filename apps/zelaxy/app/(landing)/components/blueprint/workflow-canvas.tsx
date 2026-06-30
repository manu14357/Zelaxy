'use client'

/* --------------------------------------------------------------------------
   WorkflowCanvas — a self-contained, pure-SVG schematic of a Zelaxy workflow.
   Nodes are CAD-style panels with hand-drawn line glyphs; edges carry
   animated cyan "signals". No screenshots, no images — the diagram IS the UI.
   -------------------------------------------------------------------------- */

export type NodeKind =
  | 'trigger'
  | 'agent'
  | 'memory'
  | 'mcp'
  | 'db'
  | 'vector'
  | 'llm'
  | 'decision'
  | 'loop'
  | 'deploy'
  | 'knowledge'
  | 'observe'
  | 'email'
  | 'output'

export type CanvasNode = {
  id: string
  x: number
  y: number
  kind: NodeKind
  label: string
  tag?: string
  /** icon-chip color; mirrors each block's real bgColor. Falls back to KIND_COLOR. */
  color?: string
  w?: number
  running?: boolean
}

/* Representative real block bgColors (from blocks/blocks/*.ts) */
const KIND_COLOR: Record<NodeKind, string> = {
  trigger: '#F97316',
  agent: '#802FFF',
  memory: '#F64F9E',
  mcp: '#6E56CF',
  db: '#336791',
  vector: '#00B0B0',
  llm: '#10A37F',
  decision: '#28C43F',
  loop: '#F97316',
  deploy: '#EA580C',
  knowledge: '#00B0B0',
  observe: '#6B7280',
  email: '#D93025',
  output: '#EA580C',
}

/* dark icon for light chips, white otherwise */
function iconInk(hex: string) {
  const h = hex.replace('#', '')
  if (h.length < 6) return '#ffffff'
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.7 ? '#15171a' : '#ffffff'
}

export type CanvasEdge = {
  from: string
  to: string
  /** fraction 0..1 of vertical port offset on source/target for parallel fan-out */
  dashDelay?: number
}

const NODE_W = 172
const NODE_H = 60

/* Tiny 16x16 schematic glyphs, drawn at translate(x,y). Stroke = currentColor. */
export function Glyph({ kind, color = 'currentColor' }: { kind: NodeKind; color?: string }) {
  const s = {
    fill: 'none',
    stroke: color,
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (kind) {
    case 'trigger':
      return <polyline points='9,1 3,9 8,9 7,15 13,6 8,6' {...s} />
    case 'agent':
      return <polygon points='8,1 14.5,4.7 14.5,11.3 8,15 1.5,11.3 1.5,4.7' {...s} />
    case 'memory':
      return (
        <g {...s}>
          <rect x='2' y='3' width='12' height='10' rx='1' />
          <path d='M2 6.5h12M2 9.5h12M5.5 3v10' />
        </g>
      )
    case 'mcp':
      return (
        <g {...s}>
          <rect x='4' y='5' width='8' height='7' rx='1' />
          <path d='M6 5V2M10 5V2M5 12v2M11 12v2' />
        </g>
      )
    case 'db':
      return (
        <g {...s}>
          <ellipse cx='8' cy='4' rx='5.5' ry='2.4' />
          <path d='M2.5 4v8c0 1.3 2.5 2.4 5.5 2.4s5.5-1.1 5.5-2.4V4' />
          <path d='M2.5 8.5c0 1.3 2.5 2.4 5.5 2.4s5.5-1.1 5.5-2.4' />
        </g>
      )
    case 'vector':
      return (
        <g fill={color} stroke='none'>
          {[
            [3, 4],
            [8, 3],
            [13, 5],
            [4, 9],
            [9, 8],
            [12, 11],
            [6, 13],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r='1.1' />
          ))}
        </g>
      )
    case 'llm':
      return (
        <g {...s}>
          <circle cx='8' cy='8' r='3' />
          <path d='M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13' />
        </g>
      )
    case 'decision':
      return <polygon points='8,1 15,8 8,15 1,8' {...s} />
    case 'loop':
      return (
        <g {...s}>
          <path d='M13 8a5 5 0 1 1-1.5-3.6' />
          <polyline points='11,1.5 11.8,4.6 8.7,5' />
        </g>
      )
    case 'deploy':
      return (
        <g {...s}>
          <path d='M8 14V4' />
          <polyline points='4,7 8,3 12,7' />
          <path d='M3 14h10' />
        </g>
      )
    case 'knowledge':
      return (
        <g {...s}>
          <circle cx='3.5' cy='4' r='1.6' />
          <circle cx='12.5' cy='4' r='1.6' />
          <circle cx='8' cy='13' r='1.6' />
          <path d='M4.7 5.2L7 11.6M11.3 5.2L9 11.6M5 4h6' />
        </g>
      )
    case 'observe':
      return (
        <g {...s}>
          <path d='M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8z' />
          <circle cx='8' cy='8' r='1.8' />
        </g>
      )
    case 'email':
      return (
        <g {...s}>
          <rect x='2' y='3.5' width='12' height='9' rx='1' />
          <polyline points='2.5,4.5 8,9 13.5,4.5' />
        </g>
      )
    default:
      return (
        <g {...s}>
          <polyline points='5,3 11,8 5,13' />
          <path d='M11 3v10' />
        </g>
      )
  }
}

function nodeMap(nodes: CanvasNode[]) {
  const m: Record<string, CanvasNode> = {}
  for (const n of nodes) m[n.id] = n
  return m
}

function edgePath(a: CanvasNode, b: CanvasNode) {
  const ax = a.x + (a.w ?? NODE_W)
  const ay = a.y + NODE_H / 2
  const bx = b.x
  const by = b.y + NODE_H / 2
  const dx = Math.max(40, (bx - ax) * 0.5)
  return `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`
}

export function WorkflowCanvas({
  nodes,
  edges,
  viewBox = '0 0 1000 600',
  className,
}: {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewBox?: string
  className?: string
}) {
  const map = nodeMap(nodes)

  return (
    <svg
      viewBox={viewBox}
      className={className}
      preserveAspectRatio='xMidYMid meet'
      role='img'
      aria-label='Animated Zelaxy workflow diagram with connected agent, memory, knowledge and deployment nodes'
    >
      {/* edges */}
      <g style={{ color: 'var(--bp-ink-faint)' }}>
        {edges.map((e, i) => {
          const a = map[e.from]
          const b = map[e.to]
          if (!a || !b) return null
          const d = edgePath(a, b)
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={d}
              fill='none'
              stroke='currentColor'
              strokeWidth='1.2'
              strokeDasharray='5 8'
              opacity='0.5'
            />
          )
        })}
      </g>

      {/* nodes — mirror the editor's block cards: rounded card, colored icon
          chip, bold name, muted model badge, and orange pill handles */}
      {nodes.map((n) => {
        const w = n.w ?? NODE_W
        const my = NODE_H / 2
        const chip = n.color ?? KIND_COLOR[n.kind]
        const ink = iconInk(chip)
        const badgeW = n.tag ? Math.max(24, n.tag.length * 5.6 + 12) : 0
        return (
          <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
            {/* selection/active glow */}
            {n.running && (
              <rect
                x='-1.5'
                y='-1.5'
                width={w + 3}
                height={NODE_H + 3}
                rx='15'
                fill='none'
                stroke='var(--bp-accent)'
                strokeWidth='1.5'
                opacity='0.85'
              />
            )}
            {/* card */}
            <rect
              width={w}
              height={NODE_H}
              rx='14'
              fill='var(--bp-block-card)'
              stroke='var(--bp-block-border)'
              strokeWidth='1'
            />
            {/* icon chip */}
            <rect x='12' y={my - 15} width='30' height='30' rx='9' fill={chip} />
            <g transform={`translate(${12 + 7} ${my - 8})`}>
              <Glyph kind={n.kind} color={ink} />
            </g>
            {/* name (line 1) + model badge (line 2) — stacked to avoid clipping */}
            <text
              x='52'
              y={n.tag ? my - 3 : my + 4.5}
              fontSize='12.5'
              fontWeight='600'
              fill='var(--bp-ink)'
              fontFamily='ui-sans-serif, system-ui, sans-serif'
              letterSpacing='-0.01em'
            >
              {n.label}
            </text>
            {n.tag && (
              <g transform={`translate(52 ${my + 3})`}>
                <rect width={badgeW} height='13' rx='3.5' fill='var(--bp-panel-2)' />
                <text
                  x={badgeW / 2}
                  y='9.5'
                  fontSize='8'
                  fontWeight='500'
                  textAnchor='middle'
                  fill='var(--bp-ink-dim)'
                  fontFamily='ui-monospace, monospace'
                >
                  {n.tag}
                </text>
              </g>
            )}
            {/* orange pill handles (input left, output right) */}
            <rect
              x='-3'
              y={my - 8}
              width='6'
              height='16'
              rx='3'
              fill='#fdba74'
              stroke='var(--bp-block-card)'
              strokeWidth='1.6'
            />
            <rect
              x={w - 3}
              y={my - 8}
              width='6'
              height='16'
              rx='3'
              fill='#fdba74'
              stroke='var(--bp-block-card)'
              strokeWidth='1.6'
            />
          </g>
        )
      })}
    </svg>
  )
}
