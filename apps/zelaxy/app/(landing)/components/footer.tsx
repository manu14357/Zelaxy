'use client'

import Link from 'next/link'
import { getDocsUrl } from '@/lib/docs-url'

const footerLinks = {
  Product: [
    { name: 'AI Workflow Builder', href: '/#how-it-works' },
    { name: 'Blocks Library', href: '/#blocks' },
    { name: 'Features', href: '/#features' },
    { name: 'Self-Host', href: `${getDocsUrl()}/deployment` },
  ],
  Resources: [
    { name: 'Documentation', href: getDocsUrl() },
    { name: 'GitHub', href: 'https://github.com/manu14357/Zelaxy' },
    { name: 'Changelog', href: 'https://github.com/manu14357/Zelaxy/releases' },
    { name: 'Contributing', href: 'https://github.com/manu14357/Zelaxy/blob/main/CONTRIBUTING.md' },
  ],
  Legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='currentColor'>
      <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='currentColor'>
      <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className='relative overflow-hidden border-white/[0.05] border-t bg-[#040404]'>
      {/* Google Font for wordmark */}
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      <link
        href='https://fonts.googleapis.com/css2?family=Outfit:wght@900&display=swap'
        rel='stylesheet'
      />
      <div className='mx-auto max-w-6xl px-6 sm:px-8'>
        {/* Top section: Links + Newsletter */}
        <div className='grid grid-cols-2 gap-x-8 gap-y-10 pt-16 pb-14 sm:grid-cols-3 lg:grid-cols-4'>
          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className='mb-5 font-semibold text-[11px] tracking-[0.12em] text-neutral-300 uppercase'>
                {category}
              </h3>
              <ul className='space-y-3.5'>
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className='text-[13.5px] text-neutral-400 transition-colors duration-150 hover:text-white'
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className='col-span-2 sm:col-span-3 lg:col-span-1 lg:col-start-4'>
            <h3 className='mb-1.5 font-semibold text-[11px] tracking-[0.12em] text-neutral-300 uppercase'>
              Newsletter
            </h3>
            <p className='mb-4 text-[13px] leading-relaxed text-neutral-500'>
              New features, blocks &amp; updates.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className='space-y-2'>
              <input
                type='email'
                placeholder='Your email'
                className='h-9 w-full rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 text-[13px] text-white placeholder-neutral-600 outline-none transition-colors focus:border-orange-500/50 focus:bg-white/[0.06]'
              />
              <button
                type='submit'
                className='h-9 w-full rounded-lg bg-white/[0.09] text-[13px] font-medium text-neutral-100 transition-colors hover:bg-white/[0.14] hover:text-white'
              >
                Subscribe
              </button>
            </form>

            {/* Social icons */}
            <div className='mt-6 flex items-center gap-4'>
              <a
                href='https://github.com/manu14357/Zelaxy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-neutral-500 transition-colors hover:text-neutral-200'
                aria-label='GitHub'
              >
                <GitHubIcon className='h-[17px] w-[17px]' />
              </a>
              <a
                href='https://www.linkedin.com/company/zelaxy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-neutral-500 transition-colors hover:text-neutral-200'
                aria-label='LinkedIn'
              >
                <LinkedInIcon className='h-[17px] w-[17px]' />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Large brand wordmark — full-bleed, centered */}
      <div className='border-t border-white/[0.04]'>
        <div className='flex select-none items-end justify-center gap-[clamp(0.75rem,3vw,2rem)] px-4 pt-16 pb-10'>
          <img
            src='/Zelaxy.png'
            alt=''
            aria-hidden='true'
            className='h-[clamp(4rem,16vw,12rem)] w-auto opacity-[0.55]'
          />
          <span
            className='font-black text-[clamp(4.5rem,18vw,14rem)] uppercase leading-[0.82] tracking-[0.06em] text-orange-400/50'
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            Zelaxy
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className='mx-auto max-w-6xl px-6 sm:px-8'>
        <div className='flex flex-col items-center justify-between gap-3 border-white/[0.04] border-t py-6 sm:flex-row'>
          <div className='flex items-center gap-2'>
            <span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' />
            <span className='text-[12px] text-neutral-500'>All systems operational</span>
          </div>
          <div className='flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-end'>
            <a
              href='https://github.com/manu14357/Zelaxy/blob/main/LICENSE'
              target='_blank'
              rel='noopener noreferrer'
              className='text-[12px] text-neutral-500 transition-colors hover:text-neutral-300'
            >
              MIT License
            </a>
            <Link
              href='/privacy'
              className='text-[12px] text-neutral-500 transition-colors hover:text-neutral-300'
            >
              Privacy policy
            </Link>
            <Link
              href='/terms'
              className='text-[12px] text-neutral-500 transition-colors hover:text-neutral-300'
            >
              Terms of service
            </Link>
            <span className='text-[12px] text-neutral-600'>© 2026 Zelaxy</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
