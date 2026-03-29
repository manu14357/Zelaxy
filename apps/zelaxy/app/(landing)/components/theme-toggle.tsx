'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      className='group h-10 w-10 rounded-full p-0 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    >
      <Sun className='dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 text-orange-500 transition-all duration-500 dark:scale-0' />
      <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 text-primary transition-all duration-500 dark:rotate-0 dark:scale-100' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  )
}
