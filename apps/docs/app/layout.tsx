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

const DOCS_URL = 'https://docs.zelaxy.in'

export const metadata: Metadata = {
  title: {
    template: '%s — Zelaxy Docs',
    default: 'Zelaxy Documentation — Blocks, Tools & API Reference',
  },
  description:
    'Complete reference for Zelaxy AI agent builder — 78+ workflow blocks, 80+ tool integrations, triggers, SDK guides, and deployment tutorials.',
  metadataBase: new URL(DOCS_URL),
  applicationName: 'Zelaxy Docs',
  authors: [{ name: 'Zelaxy', url: 'https://zelaxy.in' }],
  creator: 'Zelaxy',
  publisher: 'Zelaxy',
  keywords: [
    'Zelaxy documentation',
    'AI agent builder docs',
    'workflow blocks reference',
    'AI tool integrations',
    'Zelaxy API',
    'Zelaxy SDK',
    'workflow triggers',
    'AI agent deployment guide',
    'visual workflow editor docs',
    'no-code AI agent tutorial',
  ],
  icons: {
    icon: '/favicon.ico',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: DOCS_URL,
    siteName: 'Zelaxy Documentation',
    title: 'Zelaxy Documentation — Blocks, Tools & API Reference',
    description:
      'Complete reference for Zelaxy AI agent builder — 78+ workflow blocks, 80+ tool integrations, triggers, SDK guides, and deployment tutorials.',
    images: [
      {
        url: 'https://zelaxy.in/social/facebook.png',
        width: 1200,
        height: 630,
        alt: 'Zelaxy Documentation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zelaxy Documentation — Blocks, Tools & API Reference',
    description:
      'Complete reference for Zelaxy AI agent builder — 78+ workflow blocks, 80+ tool integrations, triggers, and SDK guides.',
    site: '@zelaxy',
    creator: '@zelaxy',
    images: ['https://zelaxy.in/social/twitter.png'],
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
  const docsStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: 'Zelaxy Documentation',
    description:
      'Complete reference for Zelaxy AI agent builder — blocks, tools, triggers, SDK guides, and deployment tutorials.',
    url: DOCS_URL,
    publisher: {
      '@type': 'Organization',
      name: 'Zelaxy',
      url: 'https://zelaxy.in',
      logo: 'https://zelaxy.in/social/og-preview.png',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': DOCS_URL,
    },
  }

  return (
    <html lang='en' className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(docsStructuredData) }}
        />
      </head>
      <body className='flex min-h-svh flex-col antialiased' suppressHydrationWarning>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
