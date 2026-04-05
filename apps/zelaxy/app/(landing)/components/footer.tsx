'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getDocsUrl } from '@/lib/docs-url'

const footerLinks = {
  Product: [
    { name: 'AI Workflow Builder', href: '/#how-it-works' },
    { name: 'Blocks Library', href: '/#blocks' },
    { name: 'Features', href: '/#features' },
    { name: 'Self-Host', href: `${getDocsUrl()}/deployment` },
  ],
  'Get Started': [
    { name: 'Create Free Account', href: '/signup' },
    { name: 'Sign In', href: '/login' },
    { name: 'Documentation', href: getDocsUrl() },
  ],
  Resources: [
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
    <footer className='relative mt-20 overflow-hidden border-neutral-200 border-t bg-neutral-50 text-neutral-500 dark:border-white/[0.06] dark:bg-[#050507] dark:text-neutral-400'>
      <div className='mx-auto max-w-7xl px-6 py-14 lg:px-8'>
        <div className='xl:grid xl:grid-cols-3 xl:gap-8'>
          {/* Logo & description */}
          <div className='space-y-6 xl:col-span-1'>
            <Link href='/' className='flex items-center gap-3'>
              <Image
                src='/zelaxy.svg'
                alt='Zelaxy'
                width={40}
                height={40}
                unoptimized
                className='h-10 w-10 shrink-0'
              />
              <span className='font-bold text-neutral-900 text-xl tracking-tight dark:text-white'>Zelaxy</span>
            </Link>
            <p className='max-w-xs text-neutral-500 text-sm leading-6'>
              The open-source AI workflow builder. Connect APIs, customize blocks, and build
              powerful automations with ease.
            </p>
            <div className='flex gap-x-5'>
              <a
                href='https://github.com/manu14357/Zelaxy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-neutral-400 transition-colors hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-white'
              >
                <span className='sr-only'>GitHub</span>
                <GitHubIcon className='h-5 w-5' />
              </a>
              <a
                href='https://www.linkedin.com/company/zelaxy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-neutral-400 transition-colors hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-white'
              >
                <span className='sr-only'>LinkedIn</span>
                <LinkedInIcon className='h-5 w-5' />
              </a>
            </div>
            <a
              href='https://github.com/sponsors/manu14357'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 font-medium text-pink-400 text-sm transition-colors hover:border-pink-500/50 hover:bg-pink-500/20 hover:text-pink-300'
            >
              ❤️ Sponsor our open-source work
            </a>
          </div>

          {/* Link columns */}
          <div className='mt-14 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0'>
            <div className='md:grid md:grid-cols-2 md:gap-8'>
              <div>
                <h3 className='font-semibold text-neutral-400 text-xs uppercase tracking-widest'>
                  Product
                </h3>
                <ul className='mt-5 space-y-3.5'>
                  {footerLinks.Product.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className='text-neutral-500 text-sm transition-colors hover:text-neutral-900 dark:hover:text-white'
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='mt-10 md:mt-0'>
                <h3 className='font-semibold text-neutral-400 text-xs uppercase tracking-widest'>
                  Get Started
                </h3>
                <ul className='mt-5 space-y-3.5'>
                  {footerLinks['Get Started'].map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className='text-neutral-500 text-sm transition-colors hover:text-neutral-900 dark:hover:text-white'
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className='md:grid md:grid-cols-2 md:gap-8'>
              <div>
                <h3 className='font-semibold text-neutral-400 text-xs uppercase tracking-widest'>
                  Resources
                </h3>
                <ul className='mt-5 space-y-3.5'>
                  {footerLinks.Resources.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className='text-neutral-500 text-sm transition-colors hover:text-neutral-900 dark:hover:text-white'
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='mt-10 md:mt-0'>
                <h3 className='font-semibold text-neutral-400 text-xs uppercase tracking-widest'>
                  Legal
                </h3>
                <ul className='mt-5 space-y-3.5'>
                  {footerLinks.Legal.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className='text-neutral-500 text-sm transition-colors hover:text-neutral-900 dark:hover:text-white'
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large brand wordmark */}
      <div className='select-none overflow-hidden border-neutral-200 border-t dark:border-white/[0.04]'>
        <p
          className='px-4 pt-10 pb-6 text-center font-black text-neutral-100 uppercase leading-none tracking-[0.04em] dark:text-white/[0.04]'
          style={{ fontSize: 'clamp(5rem, 20vw, 15rem)' }}
          aria-hidden='true'
        >
          ZELAXY
        </p>
      </div>

      {/* Bottom bar */}
      <div className='border-neutral-200 border-t bg-neutral-100/50 dark:border-white/[0.04] dark:bg-black/20'>
        <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 md:flex-row lg:px-8'>
          <p className='text-neutral-400 text-xs dark:text-neutral-600'>
            &copy; {new Date().getFullYear()} Zelaxy. All rights reserved. MIT License.
          </p>
          <div className='flex items-center gap-2'>
            <span className='relative flex h-2 w-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
            </span>
            <span className='text-neutral-400 text-xs dark:text-neutral-600'>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
