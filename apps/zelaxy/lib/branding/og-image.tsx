import { ImageResponse } from 'next/og'

/**
 * Shared 1200x630 social-share image that mirrors the landing hero, so a shared
 * zelaxy.in link previews the product (dark canvas + grid + "Where AI systems are built.")
 * instead of a bare logo. Used by both app/opengraph-image and app/twitter-image.
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_ALT = 'Zelaxy — the visual operating system for AI work'
export const OG_CONTENT_TYPE = 'image/png'

const ORANGE = '#EA580C'
const AMBER = '#F59E0B'

const CHIPS = ['Agents', 'Workflows', 'Automation', 'Deploy']

export function renderOgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '76px 84px',
        background: '#060606',
        color: '#ffffff',
        // engineering grid + warm accent glow (matches the hero background)
        backgroundImage:
          'radial-gradient(900px 520px at 100% -12%, rgba(234,88,12,0.30), rgba(6,6,6,0) 62%), ' +
          'linear-gradient(rgba(255,255,255,0.045) 1px, rgba(6,6,6,0) 1px), ' +
          'linear-gradient(90deg, rgba(255,255,255,0.045) 1px, rgba(6,6,6,0) 1px)',
        backgroundSize: '100% 100%, 46px 46px, 46px 46px',
      }}
    >
      {/* Brand row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div
          style={{
            display: 'flex',
            width: 78,
            height: 78,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${AMBER}, ${ORANGE})`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 7, transform: 'skewX(-12deg)' }}>
            <div
              style={{
                display: 'flex',
                width: 11,
                height: 40,
                background: '#fff',
                borderRadius: 3,
              }}
            />
            <div
              style={{
                display: 'flex',
                width: 11,
                height: 40,
                background: '#fff',
                borderRadius: 3,
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1 }}>Zelaxy</span>
          <span style={{ fontSize: 21, color: '#9a9a9a' }}>The OS for AI work</span>
        </div>
      </div>

      {/* Headline + tagline */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: 86,
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: -2,
          }}
        >
          <span>Where AI systems are&nbsp;</span>
          <span style={{ color: ORANGE }}>built.</span>
        </div>
        <span
          style={{ fontSize: 31, color: '#bcbcbc', marginTop: 28, maxWidth: 960, lineHeight: 1.36 }}
        >
          Compose agents, workflows, automation, reasoning and knowledge on one visual canvas — then
          deploy to production, together, in real time.
        </span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 27, color: '#eaeaea', fontWeight: 600 }}>zelaxy.in</span>
        <div style={{ display: 'flex', gap: 14 }}>
          {CHIPS.map((c) => (
            <div
              key={c}
              style={{
                display: 'flex',
                fontSize: 22,
                color: '#d2d2d2',
                padding: '11px 20px',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 999,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>,
    { ...OG_SIZE }
  )
}
