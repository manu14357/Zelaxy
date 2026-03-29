import type {
  AnchorHTMLAttributes,
  BlockquoteHTMLAttributes,
  HTMLAttributes,
  ImgHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'

/**
 * Custom MDX component overrides for enhanced Zelaxy docs rendering.
 */
const customComponents: MDXComponents = {
  // ── h1: suppressed — DocsTitle renders the page title ──────────────────────
  h1: () => null,

  // ── h2: clean, no border — accent dot handled in CSS ───────────────────────
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      {...props}
      className={[
        'group relative mt-10 mb-3 flex items-center gap-2',
        'font-[650] text-[1.375rem] leading-[1.2] tracking-[-0.03em]',
        'text-[hsl(var(--heading-h2))]',
        props.className ?? '',
      ]
        .join(' ')
        .trim()}
    />
  ),

  // ── h3: refined weight + spacing ───────────────────────────────────────────
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      {...props}
      className={[
        'mt-7 mb-2',
        'font-semibold text-[1.125rem] leading-[1.25] tracking-[-0.025em]',
        'text-[hsl(var(--heading-h3))]',
        props.className ?? '',
      ]
        .join(' ')
        .trim()}
    />
  ),

  // ── h4: subtle, all prose weight ───────────────────────────────────────────
  h4: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      {...props}
      className={[
        'mt-5 mb-1.5',
        'font-semibold text-[1rem] leading-[1.3] tracking-[-0.02em]',
        'text-[hsl(var(--heading-h4))]',
        props.className ?? '',
      ]
        .join(' ')
        .trim()}
    />
  ),

  // ── External links — arrow indicator ────────────────────────────────────────
  a: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isExternal =
      typeof props.href === 'string' &&
      (props.href.startsWith('http://') || props.href.startsWith('https://'))

    if (isExternal) {
      return (
        <a
          {...props}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-0.5 text-[hsl(var(--fd-primary))] transition-opacity hover:opacity-75'
        >
          {props.children}
          <svg
            width='11'
            height='11'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='ml-0.5 inline-block shrink-0 translate-y-[-1px] opacity-40'
            aria-hidden='true'
          >
            <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
            <polyline points='15 3 21 3 21 9' />
            <line x1='10' y1='14' x2='21' y2='3' />
          </svg>
        </a>
      )
    }

    return <a {...props} />
  },

  // ── Images — borderless, shadow-only depth + optional caption ───────────────
  img: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    <span className='my-7 block'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        loading='lazy'
        decoding='async'
        alt={props.alt ?? ''}
        className={[
          'w-full rounded-[0.625rem]',
          // No border — depth via layered shadows only
          'shadow-[0_2px_8px_hsl(220_13%_0%/0.06),0_1px_2px_hsl(220_13%_0%/0.04)]',
          'dark:shadow-[0_2px_12px_hsl(0_0%_0%/0.3),0_1px_3px_hsl(0_0%_0%/0.2)]',
          'transition-shadow duration-300',
          props.className ?? '',
        ]
          .join(' ')
          .trim()}
      />
      {props.alt && props.alt !== '' && (
        <span className='mt-2.5 block text-center text-[0.75rem] text-[hsl(var(--fd-muted-foreground))] italic leading-relaxed opacity-75'>
          {props.alt}
        </span>
      )}
    </span>
  ),

  // ── Table — responsive scroll, no extra border (border lives on table itself) ─
  table: (props: HTMLAttributes<HTMLTableElement>) => (
    <div
      className={[
        '-mx-1 my-5 overflow-x-auto px-1',
        // Subtle fade mask on horizontal scroll
        '[mask-image:linear-gradient(to_right,transparent_0,black_1rem,black_calc(100%-1rem),transparent_100%)]',
        '[webkit-mask-image:linear-gradient(to_right,transparent_0,black_1rem,black_calc(100%-1rem),transparent_100%)]',
      ].join(' ')}
    >
      <table {...props} />
    </div>
  ),

  // ── th — no border, uppercase label style ───────────────────────────────────
  th: (props: ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      {...props}
      className={[
        'px-3.5 py-2.5',
        'font-[700] text-[0.6875rem] uppercase tracking-[0.1em]',
        'bg-[hsl(var(--fd-muted))] text-[hsl(var(--fd-muted-foreground))]',
        'border-[hsl(var(--fd-border))] border-b', // keep only bottom divider
        'text-left',
        props.className ?? '',
      ]
        .join(' ')
        .trim()}
    />
  ),

  // ── td — no side borders, only subtle bottom rule ───────────────────────────
  td: (props: TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      {...props}
      className={[
        'px-3.5 py-2',
        'align-middle text-[0.8125rem] leading-relaxed',
        'border-[hsl(var(--fd-border)/0.35)] border-b',
        'text-[hsl(var(--fd-muted-foreground))]',
        props.className ?? '',
      ]
        .join(' ')
        .trim()}
    />
  ),

  // ── Blockquote — gradient fill, no harsh border feel ───────────────────────
  blockquote: (props: BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...props}
      className={[
        'relative my-6 py-3.5 pr-4 pl-4',
        'rounded-r-[0.625rem]',
        // Soft left accent bar
        'border-l-[3px] border-l-[hsl(var(--fd-primary)/0.45)]',
        // Gradient background, no hard box border
        'bg-gradient-to-r from-[hsl(var(--fd-accent)/0.35)] to-[hsl(var(--fd-accent)/0.08)]',
        'dark:from-[hsl(var(--fd-accent)/0.2)] dark:to-transparent',
        '[&_p]:m-0 [&_p]:text-[hsl(var(--fd-muted-foreground))] [&_p]:italic',
        props.className ?? '',
      ]
        .join(' ')
        .trim()}
    />
  ),

  // ── Horizontal rule — gradient fade, zero border ────────────────────────────
  hr: () => (
    <div
      aria-hidden='true'
      className='my-10 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--fd-border)/0.6)] to-transparent'
    />
  ),

  // ── Inline code — pill style, no border ─────────────────────────────────────
  code: (props: HTMLAttributes<HTMLElement>) => {
    // Let pre > code pass through unchanged (handled by fumadocs)
    const isBlock = (props as { 'data-language'?: string })['data-language']
    if (isBlock) return <code {...props} />

    return (
      <code
        {...props}
        className={[
          'rounded-[0.35em] px-[0.4em] py-[0.15em]',
          'font-[500] text-[0.8125em]',
          'bg-[hsl(var(--fd-accent))]',
          'text-[hsl(var(--fd-accent-foreground))]',
          'whitespace-nowrap',
          // No border — background contrast is enough
          props.className ?? '',
        ]
          .join(' ')
          .trim()}
      />
    )
  },
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...customComponents,
    ...components,
  }
}
