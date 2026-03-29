'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'

interface NavWrapperProps {
  onOpenTypeformLink?: () => void
}

export default function NavWrapper({ onOpenTypeformLink }: NavWrapperProps) {
  return (
    <nav className='fixed top-0 right-0 left-0 z-50 border-gray-100 border-b bg-white/80 shadow-lg backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-gray-900/20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='group flex items-center space-x-2'>
            <div className='flex h-14 w-14 items-center justify-center'>
              <svg
                width='40'
                height='40'
                viewBox='0 0 100 100'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='text-primary transition-colors duration-300 dark:text-white'
              >
                <circle cx='50' cy='15' r='4' stroke='currentColor' strokeWidth='5' fill='none' />
                <path
                  d='M50 15 L50 40'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M50 40 L35 20'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <path
                  d='M50 40 L65 20'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <path
                  d='M35 20 L20 45 L20 75 Q20 82 30 85 L50 85'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <path
                  d='M65 20 L80 45 L80 75 Q80 82 70 85 L50 85'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <circle cx='40' cy='55' r='4' fill='currentColor' />
                <circle cx='60' cy='55' r='4' fill='currentColor' />
                <path
                  d='M40 68 Q50 76 60 68'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
              </svg>
            </div>
            <span className='bg-gradient-to-r from-primary to-orange-600 bg-clip-text font-bold text-transparent text-xl transition-all duration-300 dark:bg-none dark:text-white'>
              Zelaxy
            </span>
          </Link>

          {/* Navigation Items */}
          <div className='hidden items-center space-x-8 md:flex'>
            <Link
              href='#features'
              className='group relative font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            >
              Features
              <span className='-bottom-1 absolute left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-orange-600 transition-all duration-300 group-hover:w-full' />
            </Link>
            <Link
              href='#workflows'
              className='group relative font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            >
              Workflows
              <span className='-bottom-1 absolute left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-orange-600 transition-all duration-300 group-hover:w-full' />
            </Link>
            <Link
              href='#integrations'
              className='group relative font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            >
              Integrations
              <span className='-bottom-1 absolute left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-orange-600 transition-all duration-300 group-hover:w-full' />
            </Link>
          </div>

          {/* CTA Buttons & Theme Toggle */}
          <div className='flex items-center space-x-4'>
            <ThemeToggle />
            <Link href='/login'>
              <Button
                variant='ghost'
                className='text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              >
                Sign In
              </Button>
            </Link>
            {onOpenTypeformLink ? (
              <Button
                onClick={onOpenTypeformLink}
                className='rounded-full bg-gradient-to-r from-primary to-orange-600 px-6 text-white shadow-lg transition-all duration-300 hover:from-orange-700 hover:to-orange-700 hover:shadow-xl'
              >
                Get Started
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            ) : (
              <Link href='/workspace'>
                <Button className='rounded-full bg-gradient-to-r from-primary to-orange-600 px-6 text-white shadow-lg transition-all duration-300 hover:from-orange-700 hover:to-orange-700 hover:shadow-xl'>
                  Get Started
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
