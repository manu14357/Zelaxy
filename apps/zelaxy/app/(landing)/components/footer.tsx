'use client'

import Link from 'next/link'
import { getDocsUrl } from '@/lib/docs-url'

const docs = getDocsUrl()

const COLUMNS: { title: string; links: { name: string; href: string }[] }[] = [
  {
    title: 'Platform',
    links: [
      { name: 'The Canvas', href: '#canvas' },
      { name: 'Capabilities', href: '#capabilities' },
      { name: 'Ecosystem', href: '#ecosystem' },
      { name: 'Enterprise', href: '#enterprise' },
      { name: 'Open Platform', href: '#open' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { name: 'Documentation', href: docs },
      { name: 'API Reference', href: `${docs}/api` },
      { name: 'SDKs', href: `${docs}/sdk` },
      { name: 'Self-Host', href: `${docs}/deployment` },
      { name: 'GitHub', href: 'https://github.com/manu14357/Zelaxy' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Templates', href: '#open' },
      { name: 'Changelog', href: 'https://github.com/manu14357/Zelaxy/releases' },
      {
        name: 'Contributing',
        href: 'https://github.com/manu14357/Zelaxy/blob/main/CONTRIBUTING.md',
      },
      { name: 'Roadmap', href: 'https://github.com/manu14357/Zelaxy' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'Sign In', href: '/login' },
      { name: 'Get Started', href: '/arena' },
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
    ],
  },
]

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className='s-bg relative overflow-hidden'>
      <div className='hair-strong absolute inset-x-0 top-0 h-px' />
      <div className='mx-auto max-w-[1320px] px-5 sm:px-8'>
        {/* index grid */}
        <div className='grid grid-cols-2 gap-x-8 gap-y-12 py-16 md:grid-cols-3 lg:grid-cols-5'>
          {/* brand */}
          <div className='col-span-2 md:col-span-1'>
            <Link href='/' className='flex items-center gap-2.5'>
              <span className='b-strong s-panel grid h-8 w-8 place-items-center rounded-[7px] border'>
                <img
                  src='/Zelaxy.png'
                  alt=''
                  width={18}
                  height={18}
                  className='h-[18px] w-[18px]'
                />
              </span>
              <span className='t-ink font-semibold text-[16px] tracking-[-0.01em]'>Zelaxy</span>
            </Link>
            <p className='t-dim mt-5 max-w-xs text-[14px] leading-relaxed'>
              The visual operating system for AI work. Build agents, workflows and automations on
              one canvas — then deploy anywhere.
            </p>
            <a
              href='https://github.com/manu14357/Zelaxy'
              target='_blank'
              rel='noopener noreferrer'
              className='t-dim hover-ink mt-6 inline-flex max-w-full items-center gap-2 text-[13px]'
            >
              <GitHubIcon className='h-4 w-4 shrink-0' />
              <span className='truncate'>github.com/manu14357/Zelaxy</span>
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title}>
              <h3 className='bp-label t-faint'>{col.title}</h3>
              <ul className='mt-5 space-y-3'>
                {col.links.map((l) => (
                  <li key={l.name}>
                    <a
                      href={l.href}
                      target={l.href.startsWith('http') ? '_blank' : undefined}
                      rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className='t-dim hover-ink text-[14px]'
                    >
                      {l.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* giant wordmark */}
        <div className='b-hair select-none border-t'>
          <p
            aria-hidden='true'
            className='wordmark bp-display t-ink py-8 text-center font-semibold leading-none opacity-[0.05]'
          >
            ZELAXY
          </p>
        </div>
      </div>

      {/* status bar */}
      <div className='b-hair border-t'>
        <div className='mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-5 py-5 sm:flex-row sm:px-8'>
          <p className='t-faint bp-label'>© {new Date().getFullYear()} Zelaxy — MIT License</p>
          <div className='bp-label flex items-center gap-5'>
            <span className='t-faint'>OS v1.0.0</span>
            <span className='flex items-center gap-2'>
              <span className='bp-pulse s-accent h-1.5 w-1.5 rounded-full' />
              <span className='t-dim'>All systems operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
