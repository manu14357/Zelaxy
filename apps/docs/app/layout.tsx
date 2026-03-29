import './global.css'
import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    template: '%s — Zelaxy Docs',
    default: 'Zelaxy Documentation',
  },
  description:
    'Documentation for Zelaxy — the AI-powered workflow automation platform. 78+ blocks, 80+ tools, visual builder.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    siteName: 'Zelaxy Documentation',
    title: 'Zelaxy Documentation',
    description: 'Documentation for Zelaxy — the AI-powered workflow automation platform.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
      <body className='flex min-h-svh flex-col antialiased' suppressHydrationWarning>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
