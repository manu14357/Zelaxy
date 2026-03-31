import Link from 'next/link'
import type { MDXComponents } from 'mdx/types'

// ── Prose element components ──────────────────────────────────────────────────

function H2({ children }: { children?: React.ReactNode }) {
  return (
    <h2 className='mb-6 flex items-center gap-3 border-white/[0.06] border-b pb-3 font-semibold text-xl text-white'>
      <span className='h-5 w-0.5 shrink-0 rounded-full bg-orange-400' />
      {children}
    </h2>
  )
}

function H3({ children }: { children?: React.ReactNode }) {
  return <h3 className='mb-3 font-medium text-base text-orange-400'>{children}</h3>
}

function P({ children }: { children?: React.ReactNode }) {
  return <p className='mb-4 leading-relaxed text-neutral-400 last:mb-0'>{children}</p>
}

function UL({ children }: { children?: React.ReactNode }) {
  return <ul className='mb-6 space-y-2 last:mb-0'>{children}</ul>
}

function LI({ children }: { children?: React.ReactNode }) {
  return (
    <li className='flex items-start gap-3 text-neutral-400'>
      <span className='mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-orange-400' />
      <span>{children}</span>
    </li>
  )
}

function Strong({ children }: { children?: React.ReactNode }) {
  return <strong className='font-medium text-neutral-200'>{children}</strong>
}

function A({ href, children }: { href?: string; children?: React.ReactNode }) {
  const isExternal = href?.startsWith('http') || href?.startsWith('mailto:')
  return (
    <Link
      href={href ?? '#'}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className='text-orange-400 underline decoration-orange-400/30 underline-offset-4 transition-colors hover:text-orange-300'
    >
      {children}
    </Link>
  )
}

function Section({ id, children }: { id?: string; children?: React.ReactNode }) {
  return <section id={id}>{children}</section>
}

// ── Custom JSX components (used inside MDX files) ─────────────────────────────

function Definitions({ children }: { children?: React.ReactNode }) {
  return <div className='space-y-3 mb-4'>{children}</div>
}

function Def({ term, children }: { term: string; children?: React.ReactNode }) {
  return (
    <div className='flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3'>
      <span className='shrink-0 font-medium text-orange-400 min-w-[110px]'>{term}</span>
      <span className='text-[13.5px] leading-relaxed text-neutral-500'>{children}</span>
    </div>
  )
}

function Highlight({ children }: { children?: React.ReactNode }) {
  return (
    <div className='my-4 rounded-xl border border-orange-400/20 bg-orange-400/5 p-5'>
      <div className='text-[14px] leading-relaxed text-neutral-300'>{children}</div>
    </div>
  )
}

function ServiceCards({ children }: { children?: React.ReactNode }) {
  return <div className='space-y-4 mb-4'>{children}</div>
}

function ServiceCard({ name, children }: { name: string; children?: React.ReactNode }) {
  return (
    <div className='rounded-xl border border-white/[0.05] bg-white/[0.02] p-4'>
      <h3 className='mb-1 font-medium text-orange-400'>{name}</h3>
      <p className='text-[13.5px] leading-relaxed text-neutral-500'>{children}</p>
    </div>
  )
}

function PaymentBadge({ processor }: { processor: string }) {
  return (
    <div className='my-4 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-[13px] text-neutral-400'>
      <span className='h-1.5 w-1.5 rounded-full bg-orange-400' />
      Payment processor: <span className='font-medium text-white'>{processor}</span>
    </div>
  )
}

function ScopeBadges(props: Record<string, string>) {
  const items = Object.entries(props)
    .filter(([k]) => k.startsWith('item'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
  return (
    <div className='mb-6 flex flex-wrap gap-2'>
      {items.map((item) => (
        <span
          key={item}
          className='rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[13px] text-neutral-400'
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function ContactButton({ email }: { email: string }) {
  return (
    <Link
      href={`mailto:${email}`}
      className='inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-5 py-2.5 font-medium text-[14px] text-orange-400 transition-colors hover:bg-orange-400/20'
    >
      {email}
    </Link>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export const legalMdxComponents: MDXComponents = {
  h2: H2,
  h3: H3,
  p: P,
  ul: UL,
  li: LI,
  strong: Strong,
  a: A,
  section: Section,
  // Custom components for use inside .mdx files
  Definitions,
  Def,
  Highlight,
  ServiceCards,
  ServiceCard,
  PaymentBadge,
  ScopeBadges,
  ContactButton,
}
