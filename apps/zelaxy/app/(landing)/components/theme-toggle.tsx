'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  const toggle = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <button
      type='button'
      onClick={toggle}
      aria-label='Toggle theme'
      className='relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    >
      <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 text-orange-500 transition-all duration-500 dark:rotate-90 dark:scale-0' />
      <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 text-primary transition-all duration-500 dark:rotate-0 dark:scale-100' />
    </button>
  )
}
