import Link from 'next/link'

const footerLinks = {
  Resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'GitHub', href: 'https://github.com/manu14357/Zelaxy', external: true },
    { name: 'Changelog', href: 'https://github.com/manu14357/Zelaxy/releases', external: true },
    {
      name: 'Contributing',
      href: 'https://github.com/manu14357/Zelaxy/blob/main/CONTRIBUTING.md',
      external: true,
    },
  ],
  Product: [
    { name: 'Home', href: 'https://zelaxy.in', external: true },
    { name: 'Blocks Library', href: '/docs/blocks' },
    { name: 'Tools', href: '/docs/tools' },
    { name: '❤️ Sponsor', href: 'https://github.com/sponsors/manu14357', external: true },
  ],
  Legal: [
    { name: 'Privacy Policy', href: 'https://zelaxy.in/privacy', external: true },
    { name: 'Terms of Service', href: 'https://zelaxy.in/terms', external: true },
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

export function DocsFooter() {
  return (
    <footer className='relative z-10 mt-12 border-fd-border border-t bg-fd-background'>
      {/* CTA Banner */}
      <div className='border-fd-border border-b'>
        <div className='mx-auto flex w-full max-w-[var(--fd-page-width)] flex-col items-center gap-4 px-4 py-10 text-center sm:px-6 xl:pe-[calc(var(--fd-toc-width)+1rem)]'>
          <h3 className='font-bold text-fd-foreground text-xl tracking-[-0.02em]'>
            Ready to build AI workflows?
          </h3>
          <p className='max-w-md text-[14px] text-fd-muted-foreground'>
            Create your free account and start building automations in minutes — no credit card
            required.
          </p>
          <div className='flex items-center gap-3'>
            <a
              href='https://zelaxy.in/signup'
              className='inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 font-semibold text-[13px] text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-200 hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]'
            >
              Create Free Account &rarr;
            </a>
            <a
              href='https://zelaxy.in/login'
              className='inline-flex items-center gap-2 rounded-full border border-fd-border px-5 py-2 font-medium text-[13px] text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground'
            >
              Sign In
            </a>
          </div>
        </div>
      </div>

      <div className='mx-auto w-full max-w-[var(--fd-page-width)] px-4 sm:px-6 xl:pe-[calc(var(--fd-toc-width)+1rem)]'>
        {/* Main footer content */}
        <div className='grid grid-cols-2 gap-x-6 gap-y-8 pt-10 pb-8 sm:grid-cols-3 md:grid-cols-4'>
          {/* Brand column */}
          <div className='col-span-2 sm:col-span-3 md:col-span-1'>
            <Link href='/docs' className='inline-flex items-center gap-2.5'>
              <img
                src='https://zelaxy.in/Zelaxy.png'
                alt='Zelaxy'
                width={24}
                height={24}
                className='h-6 w-6'
              />
              <div className='flex items-baseline gap-1.5'>
                <span className='font-semibold text-[15px] text-fd-foreground tracking-[-0.025em]'>
                  Zelaxy
                </span>
                <span className='font-medium text-[11px] text-orange-500/80 uppercase tracking-wide dark:text-orange-400/60'>
                  Docs
                </span>
                <span className='rounded-full border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 font-medium text-[10px] text-orange-500/80 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-400/60'>
                  v0.1.0
                </span>
              </div>
            </Link>
            <p className='mt-3 max-w-[240px] text-[13px] text-fd-muted-foreground leading-relaxed'>
              Complete reference for the Zelaxy AI agent builder — blocks, tools, triggers &amp; SDK
              guides.
            </p>

            {/* Social icons */}
            <div className='mt-4 flex items-center gap-4'>
              <a
                href='https://github.com/manu14357/Zelaxy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-fd-muted-foreground transition-colors hover:text-fd-foreground'
                aria-label='GitHub'
              >
                <GitHubIcon className='h-[17px] w-[17px]' />
              </a>
              <a
                href='https://www.linkedin.com/company/zelaxy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-fd-muted-foreground transition-colors hover:text-fd-foreground'
                aria-label='LinkedIn'
              >
                <LinkedInIcon className='h-[17px] w-[17px]' />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className='mb-4 font-semibold text-[11px] text-fd-foreground uppercase tracking-[0.1em]'>
                {category}
              </h3>
              <ul className='space-y-3'>
                {links.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground'
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className='text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground'
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className='border-fd-border border-t'>
        <div className='mx-auto flex w-full max-w-[var(--fd-page-width)] flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6 xl:pe-[calc(var(--fd-toc-width)+1rem)]'>
          <span className='text-[12px] text-fd-muted-foreground'>
            © {new Date().getFullYear()} Zelaxy. All rights reserved.
          </span>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            <a
              href='https://zelaxy.in/privacy'
              target='_blank'
              rel='noopener noreferrer'
              className='text-[12px] text-fd-muted-foreground transition-colors hover:text-fd-foreground'
            >
              Privacy Policy
            </a>
            <a
              href='https://zelaxy.in/terms'
              target='_blank'
              rel='noopener noreferrer'
              className='text-[12px] text-fd-muted-foreground transition-colors hover:text-fd-foreground'
            >
              Terms of Service
            </a>
            <a
              href='https://github.com/manu14357/Zelaxy/blob/main/LICENSE'
              target='_blank'
              rel='noopener noreferrer'
              className='text-[12px] text-fd-muted-foreground transition-colors hover:text-fd-foreground'
            >
              MIT License
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
