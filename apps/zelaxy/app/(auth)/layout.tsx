'use client'

import { ThemeProvider } from '@/app/(landing)/components/theme-provider'
import '@/app/(landing)/components/blueprint.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme='light' storageKey='zelaxy-theme'>
      <main className='s-bg relative flex min-h-screen flex-col'>
        {/* dot grid */}
        <div className='bp-canvas-dots pointer-events-none absolute inset-0 opacity-70' />
        {/* orange glow top-center */}
        <div className='glow-center pointer-events-none absolute inset-0' />
        <div className='relative z-10 flex flex-1 items-center justify-center px-5 py-12'>
          {children}
        </div>
      </main>
    </ThemeProvider>
  )
}
