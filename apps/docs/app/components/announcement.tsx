import { Banner } from 'fumadocs-ui/components/banner'
import { ArrowRight } from 'lucide-react'
import { getDocCounts } from '@/lib/doc-counts'

/* ──────────────────────────────────────────────────────────────────────────
 * SITE-WIDE ANNOUNCEMENT BAR — a full-width animated "rainbow" strip pinned to
 * the very TOP of the page, above the navbar. Edit the constants to change/hide.
 *   - SHOW = false hides it entirely.
 *   - Bump ID whenever the wording changes so it re-appears for users who
 *     dismissed the previous one (dismissal is remembered per-id). The block/
 *     tool counts themselves are live (lib/doc-counts.ts) and don't need an
 *     ID bump when they change — only bump for actual copy changes.
 * Built on Fumadocs' <Banner>, which reserves its height (--fd-banner-height)
 * and pushes the navbar + layout down automatically.
 * ────────────────────────────────────────────────────────────────────────── */
const SHOW = true
const ID = 'zelaxy-docs-2026-launch'
const HREF = '/docs/blocks'
const CTA = 'Explore the reference'

export function Announcement() {
  if (!SHOW) return null
  const { blocks, tools } = getDocCounts()
  return (
    <Banner id={ID} variant='rainbow' height='2.75rem' className='text-[13px]'>
      <a href={HREF} className='group flex min-w-0 items-center gap-2 font-medium'>
        <span className='shrink-0 rounded-full bg-fd-foreground/10 px-1.5 py-0.5 font-semibold text-[10px] uppercase tracking-wide'>
          New
        </span>
        <span className='truncate'>
          {blocks}+ blocks and {tools}+ tools are now fully documented
        </span>
        <span className='hidden shrink-0 items-center gap-1 font-semibold text-fd-primary underline-offset-2 group-hover:underline sm:inline-flex'>
          {CTA}
          <ArrowRight className='h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
        </span>
      </a>
    </Banner>
  )
}
