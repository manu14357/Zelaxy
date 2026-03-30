'use client'

import Link from 'next/link'
import { getDocsUrl } from '@/lib/docs-url'

const footerLinks = {
  Product: [
    { name: 'Blocks', href: '#blocks' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
  ],
  Resources: [
    { name: 'Documentation', href: getDocsUrl() },
    { name: 'GitHub', href: 'https://github.com/manu14357/Zelaxy' },
  ],
}

export function Footer() {
  return (
    <footer className='relative border-white/[0.04] border-t bg-[#040404]'>
      <div className='mx-auto max-w-5xl px-6 sm:px-8'>
        {/* Main */}
        <div className='py-14'>
          <div className='grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5'>
            {/* Brand */}
            <div className='lg:col-span-3'>
              <Link href='/' className='mb-5 flex items-center gap-2.5'>
                <img src='/Zelaxy.png' alt='Zelaxy' width={28} height={28} className='h-7 w-7' />
                <span className='font-semibold text-[17px] text-white tracking-[-0.01em]'>
                  Zelaxy
                </span>
              </Link>
              <p className='max-w-sm text-[15px] text-neutral-500 leading-relaxed'>
                Open-source AI workflow automation platform. Build intelligent automations visually — connect, automate, and scale.
              </p>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className='mb-4 font-semibold text-[12px] text-neutral-600 uppercase tracking-[0.15em]'>
                  {category}
                </h3>
                <ul className='space-y-2.5'>
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className='text-[14px] text-neutral-500 transition-colors duration-300 hover:text-white'
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className='border-white/[0.04] border-t py-6'>
          <div className='flex flex-col items-center justify-between gap-3 md:flex-row'>
            <p className='text-[13px] text-neutral-600'>
              © 2026 Zelaxy. All rights reserved.
            </p>
            <p className='text-[13px] text-neutral-600'>
              Crafted with ❤️ by{' '}
              <a
                href='https://github.com/manu14357/Zelaxy'
                target='_blank'
                rel='noopener noreferrer'
                className='text-neutral-500 transition-colors hover:text-white'
              >
                Open Source Contributors
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
