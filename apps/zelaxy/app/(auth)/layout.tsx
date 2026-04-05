'use client'

import { useBrandConfig } from '@/lib/branding/branding'
import { ThemeProvider } from '@/app/(landing)/components/theme-provider'
import '@/app/(landing)/components/animations.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = useBrandConfig()

  return (
    <ThemeProvider defaultTheme='light' storageKey='zelaxy-theme'>
      <main className='relative flex min-h-screen flex-col overflow-hidden bg-white font-geist-sans text-neutral-900 dark:bg-[#060606] dark:text-white'>
        {/* Background gradient */}
        <div className='absolute inset-0'>
          <div className='absolute inset-0 bg-gradient-to-b from-white via-neutral-50 to-white dark:from-[#060606] dark:via-[#0a0a0a] dark:to-[#060606]' />
        </div>



        {/* Radial glow */}
        <div className='-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/3 left-1/2 h-[500px] w-[700px] rounded-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl dark:from-primary/15' />

        {/* Content */}
        <div className='relative z-10 flex flex-1'>
          <div className='w-full'>{children}</div>
        </div>
      </main>
    </ThemeProvider>
  )
}
