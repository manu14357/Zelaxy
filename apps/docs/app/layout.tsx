import './global.css'
import type { ReactNode } from 'react'
import { RootProvider } from 'fumadocs-ui/provider'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Announcement } from './components/announcement'
import CustomSearchDialog from './components/search-dialog'

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
    'Complete reference for the Zelaxy AI agent builder — workflow blocks, tool integrations, triggers, the SDK, API reference, quickstarts and deployment guides.',
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
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/Zelaxy.png', type: 'image/png', sizes: '500x500' },
    ],
    apple: '/Zelaxy.png',
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
      'Complete reference for the Zelaxy AI agent builder — workflow blocks, tool integrations, triggers, the SDK, API reference, quickstarts and deployment guides.',
    images: [
      {
        url: `${DOCS_URL}/opengraph-image`,
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
      'Complete reference for the Zelaxy AI agent builder — workflow blocks, tool integrations, triggers, the SDK, and API reference.',
    site: '@zelaxy',
    creator: '@zelaxy',
    images: [`${DOCS_URL}/opengraph-image`],
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
      logo: 'https://zelaxy.in/Zelaxy.png',
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
        {/* First-time visitors default to light; users can still switch to dark/system. */}
        {/* Static client-side search (Orama) — index fetched once, then searches are instant. */}
        <RootProvider
          theme={{ defaultTheme: 'light', enableSystem: true }}
          search={{
            SearchDialog: CustomSearchDialog,
            options: {
              type: 'static',
              // Let users narrow a search to one section, n8n-style.
              allowClear: true,
              tags: [
                { name: 'Get Started', value: 'get-started' },
                { name: 'Blocks', value: 'blocks' },
                { name: 'Tools', value: 'tools' },
                { name: 'Triggers', value: 'triggers' },
                { name: 'Guides', value: 'guides' },
                { name: 'Enterprise', value: 'enterprise' },
              ],
              // Quick links shown before the user types anything.
              links: [
                ['Quickstart', '/docs/get-started/quickstart'],
                ['Core Concepts', '/docs/get-started/core-concepts'],
                ['Agent block', '/docs/blocks/agent'],
                ['Guides — example workflows', '/docs/guides'],
                ['AI Models', '/docs/get-started/models'],
              ],
            },
          }}
        >
          <Announcement />
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
