'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDocsUrl } from '@/lib/docs-url'
import { ThemeToggle } from './theme-toggle'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#features', label: 'Features' },
    { href: '#integrations', label: 'Integrations' },
    { href: getDocsUrl(), label: 'Docs' },
  ]

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'border-neutral-200 border-b bg-white/80 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.06] dark:bg-[#060606]/80 dark:shadow-[0_1px_0_rgba(255,255,255,0.03)]'
          : 'bg-transparent'
      }`}
    >
      <div className='mx-auto max-w-6xl px-6 sm:px-8'>
        <div className='flex h-14 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='group flex items-center space-x-2'>
            <img src='/Zelaxy.png' alt='Zelaxy' width={24} height={24} className='h-6 w-6' />
            <span className='bg-gradient-to-r from-primary via-orange-400 to-amber-300 bg-clip-text font-semibold text-[17px] text-transparent tracking-[-0.01em]'>
              Zelaxy
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className='hidden items-center gap-8 md:flex'>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className='font-medium text-[13px] text-neutral-500 transition-colors duration-300 hover:text-neutral-900 dark:hover:text-white'
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right */}
          <div className='hidden items-center gap-3 md:flex'>
            <ThemeToggle />
            <Link href='/login'>
              <Button
                variant='ghost'
                className='h-8 px-3 font-medium text-[13px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              >
                Sign In
              </Button>
            </Link>
            <Link href='/arena'>
              <Button className='h-8 rounded-full bg-neutral-900 px-5 font-medium text-[13px] text-white transition-all duration-300 hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200'>
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile */}
          <div className='flex items-center gap-2 md:hidden'>
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className='rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white'
            >
              {isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className='absolute top-14 right-0 left-0 border-neutral-200 border-b bg-white/95 backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.06] dark:bg-[#060606]/95 md:hidden'>
            <div className='space-y-1 px-6 py-5'>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className='block py-2.5 font-medium text-[15px] text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className='flex flex-col gap-2 border-neutral-200 border-t pt-4 dark:border-white/[0.06]'>
                <Link href='/login'>
                  <Button
                    variant='ghost'
                    className='w-full text-[15px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href='/arena'>
                  <Button className='w-full rounded-full bg-neutral-900 text-[15px] text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200'>
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
