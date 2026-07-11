import { ImageResponse } from 'next/og'
import { ZELAXY_LOGO_DATA_URI } from '@/lib/branding/logo-data'
import { OG_ARROW_DARK_DATA_URI, OG_CONNECTORS_DATA_URI } from '@/lib/branding/og-graphics'

/**
 * 1200x630 social-share image for the docs site — the same hero-graph visual as zelaxy.in but
 * branded for documentation (Zelaxy Docs + "Read the Docs"). Used by app/opengraph-image +
 * app/twitter-image so a shared docs.zelaxy.in link previews the product.
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_ALT = 'Zelaxy Documentation — blocks, tools, triggers, SDK & API reference'
export const OG_CONTENT_TYPE = 'image/png'

const ORANGE = '#EA580C'
const AMBER = '#F59E0B'

type Node = { title: string; sub: string; color: string; left: number; top: number; hi?: boolean }
const NODES: Node[] = [
  { title: 'Webhook', sub: 'Gmail', color: '#22C55E', left: 0, top: 14, hi: true },
  { title: 'MCP Tools', sub: 'Servers', color: '#6366F1', left: 0, top: 82 },
  { title: 'Knowledge', sub: 'RAG', color: '#14B8A6', left: 0, top: 150 },
  { title: 'Memory', sub: 'Vector', color: '#EC4899', left: 0, top: 218 },
  { title: 'Agent', sub: 'Opus 4.8', color: '#7C3AED', left: 183, top: 118, hi: true },
  { title: 'Router', sub: 'LLM Judge', color: '#22C55E', left: 352, top: 31, hi: true },
  { title: 'Response', sub: 'API', color: '#F97316', left: 352, top: 118 },
  { title: 'Slack', sub: 'Send', color: '#8B5CF6', left: 352, top: 205 },
]
const LOG: Array<[string, string, string, string]> = [
  ['01', 'blocks', '#22C55E', 'triggers · agents · tools · logic'],
  ['02', 'tools', '#6366F1', 'integrations · MCP · custom SDK'],
  ['03', 'api', '#F97316', 'REST · webhooks · deployments'],
  ['04', 'guides', '#14B8A6', 'quickstart · tutorials · reference'],
]

function NodeCard({ title, sub, color, left, top, hi }: Node) {
  const isAgent = title === 'Agent'
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: isAgent ? 148 : 150,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '9px 11px',
        borderRadius: 11,
        border: hi ? `1px solid ${ORANGE}` : '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(18,18,18,0.92)',
      }}
    >
      <div style={{ display: 'flex', width: 28, height: 28, borderRadius: 8, background: color }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{title}</span>
        <span style={{ fontSize: 11, color: '#8b8b8b' }}>{sub}</span>
      </div>
    </div>
  )
}

export function renderOgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        padding: '52px 56px',
        gap: 40,
        background: '#070707',
        color: '#ffffff',
        backgroundImage:
          'radial-gradient(1100px 640px at 50% -18%, rgba(234,88,12,0.26), rgba(7,7,7,0) 60%), ' +
          'linear-gradient(rgba(255,255,255,0.04) 1px, rgba(7,7,7,0) 1px), ' +
          'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, rgba(7,7,7,0) 1px)',
        backgroundSize: '100% 100%, 44px 44px, 44px 44px',
      }}
    >
      {/* ── Left: brand + headline + tagline ── */}
      <div
        style={{ display: 'flex', flexDirection: 'column', width: 508, justifyContent: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 24 }}>
          <img src={ZELAXY_LOGO_DATA_URI} width={46} height={46} alt='Zelaxy' />
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>Zelaxy</span>
          <span
            style={{
              display: 'flex',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 1,
              color: '#1a1200',
              background: `linear-gradient(135deg, ${AMBER}, ${ORANGE})`,
              padding: '4px 10px',
              borderRadius: 7,
            }}
          >
            DOCS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span
            style={{ display: 'flex', width: 8, height: 8, borderRadius: 8, background: ORANGE }}
          />
          <span style={{ fontSize: 15, letterSpacing: 3, color: AMBER }}>DOCUMENTATION</span>
          <span
            style={{ display: 'flex', width: 26, height: 1, background: 'rgba(255,255,255,0.25)' }}
          />
          <span style={{ fontSize: 15, letterSpacing: 3, color: '#8b8b8b' }}>
            REFERENCE · GUIDES · SDK
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.03,
            letterSpacing: -2,
          }}
        >
          <span>Everything to build with&nbsp;</span>
          <span style={{ color: ORANGE }}>Zelaxy.</span>
        </div>

        <span style={{ fontSize: 21, color: '#b6b6b6', marginTop: 20, lineHeight: 1.4 }}>
          Blocks, tools, triggers, the SDK and the full API reference — with quickstarts, tutorials
          and deployment guides to ship AI agents.
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              background: `linear-gradient(135deg, ${AMBER}, ${ORANGE})`,
              color: '#1a1200',
              fontSize: 19,
              fontWeight: 600,
              padding: '12px 22px',
              borderRadius: 10,
            }}
          >
            <span>Read the Docs</span>
            <img src={OG_ARROW_DARK_DATA_URI} width={17} height={17} alt='' />
          </div>
          <span style={{ fontSize: 20, color: '#e6e6e6', fontWeight: 600 }}>docs.zelaxy.in</span>
        </div>
      </div>

      {/* ── Right: canvas · runtime panel ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.09)',
          background: 'rgba(255,255,255,0.018)',
          padding: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 14, letterSpacing: 2, color: '#9a9a9a' }}>CANVAS · RUNTIME</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'flex',
                width: 8,
                height: 8,
                borderRadius: 8,
                background: '#22C55E',
              }}
            />
            <span style={{ fontSize: 14, letterSpacing: 1, color: '#9a9a9a' }}>
              RUNNING · 1.28S
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', width: 500, height: 290 }}>
          <img
            src={OG_CONNECTORS_DATA_URI}
            width={500}
            height={290}
            alt=''
            style={{ position: 'absolute', left: 0, top: 0 }}
          />
          {NODES.map((n) => (
            <NodeCard key={n.title} {...n} />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            height: 1,
            background: 'rgba(255,255,255,0.08)',
            marginTop: 8,
            marginBottom: 12,
          }}
        />

        <span style={{ fontSize: 12, letterSpacing: 2, color: '#7a7a7a', marginBottom: 9 }}>
          WHAT'S INSIDE
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {LOG.map(([n, kind, color, msg]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13 }}>
              <span style={{ color: '#5f5f5f', width: 22 }}>{n}</span>
              <span style={{ color, width: 76 }}>{kind}</span>
              <span style={{ color: '#9a9a9a' }}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    { ...OG_SIZE }
  )
}
