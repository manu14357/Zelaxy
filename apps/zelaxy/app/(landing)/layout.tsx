'use client'

import { ThemeProvider } from '@/app/(landing)/components/theme-provider'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme='light' storageKey='zelaxy-theme'>
      {children}
    </ThemeProvider>
  )
}
