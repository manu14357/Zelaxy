'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { getDocsUrl } from '@/lib/docs-url'
import { ThemeToggle } from './theme-toggle'

const NAV = [
  { href: '#manifesto', label: 'Manifesto', id: '01' },
  { href: '#canvas', label: 'Canvas', id: '02' },
  { href: '#capabilities', label: 'Capabilities', id: '04' },
  { href: '#ecosystem', label: 'Ecosystem', id: '05' },
  { href: '#developers', label: 'Developers', id: '07' },
]

export function Navigation() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav-bar fixed inset-x-0 z-50 ${scrolled ? 'nav-bar--scrolled' : ''}`}>
      <div className='mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-5 sm:px-8'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2.5'>
          <span className='b-strong s-panel grid h-7 w-7 place-items-center rounded-[7px] border'>
            <img src='/Zelaxy.png' alt='' width={16} height={16} className='h-4 w-4' />
          </span>
          <span className='t-ink font-semibold text-[15px] tracking-[-0.01em]'>Zelaxy</span>
          <span className='t-faint bp-label hidden sm:inline' style={{ fontSize: '9px' }}>
            OS&nbsp;v1.0
          </span>
        </Link>

        {/* Desktop nav */}
        <div className='ml-6 hidden items-center gap-7 lg:flex'>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className='t-dim group flex items-center gap-1.5 text-[13px]'
            >
              <span className='t-faint bp-label' style={{ fontSize: '9px' }}>
                {item.id}
              </span>
              <span className='hover-ink'>{item.label}</span>
            </a>
          ))}
        </div>

        {/* Right */}
        <div className='ml-auto flex items-center gap-2'>
          <a href={getDocsUrl()} className='t-dim hover-ink hidden text-[13px] sm:inline'>
            Docs
          </a>
          <a
            href='https://github.com/manu14357/Zelaxy'
            target='_blank'
            rel='noopener noreferrer'
            className='t-dim hover-ink hidden text-[13px] sm:inline'
          >
            GitHub
          </a>
          <span className='hair hidden h-4 w-px sm:block' />
          <ThemeToggle />
          <Link
            href='/arena'
            className='btn-accent group ml-1 hidden items-center gap-2 rounded-md px-4 py-1.5 font-medium text-[13px] sm:inline-flex'
          >
            Start Building
            <span className='transition-transform group-hover:translate-x-0.5'>→</span>
          </Link>

          <button
            type='button'
            onClick={() => setOpen((v) => !v)}
            className='t-dim b-hair grid h-8 w-8 place-items-center rounded-md border lg:hidden'
            aria-label='Toggle menu'
          >
            {open ? <X className='h-4 w-4' /> : <Menu className='h-4 w-4' />}
          </button>
        </div>
      </div>

      {/* Mobile */}
      {open && (
        <div className='s-bg b-hair border-t lg:hidden'>
          <div className='space-y-1 px-5 py-4'>
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className='t-dim flex items-center gap-3 py-2.5 text-[15px]'
              >
                <span className='t-accent bp-label' style={{ fontSize: '10px' }}>
                  §{item.id}
                </span>
                {item.label}
              </a>
            ))}
            <div className='b-hair mt-3 flex gap-2 border-t pt-3'>
              <a
                href={getDocsUrl()}
                className='t-dim b-hair flex-1 rounded-md border py-2.5 text-center text-[14px]'
              >
                Docs
              </a>
              <Link
                href='/arena'
                className='btn-accent flex-1 rounded-md py-2.5 text-center font-medium text-[14px]'
              >
                Start Building
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
