import type { Metadata } from 'next'
import { getBrandConfig } from '@/lib/branding/branding'
import { env } from '@/lib/env'
import { getAssetUrl } from '@/lib/utils'

const SITE_URL = 'https://zelaxy.in'

/**
 * Generate dynamic metadata based on brand configuration
 */
export function generateBrandedMetadata(override: Partial<Metadata> = {}): Metadata {
  const brand = getBrandConfig()
  const baseUrl = env.NEXT_PUBLIC_APP_URL || SITE_URL

  const defaultTitle = `${brand.name} — Visual AI Agent Builder & Workflow Automation`
  const defaultDescription =
    'Build, test, and deploy AI agents on a visual drag-and-drop canvas. 78+ blocks, 80+ tools, real-time collaboration, and one-click deployment — no code required.'

  return {
    title: {
      template: `%s | ${brand.name}`,
      default: defaultTitle,
    },
    description: defaultDescription,
    applicationName: brand.name,
    authors: [{ name: brand.name, url: baseUrl }],
    generator: 'Next.js',
    keywords: [
      'AI agent builder',
      'AI workflow automation',
      'visual workflow editor',
      'no-code AI agents',
      'drag and drop AI builder',
      'AI agent deployment',
      'workflow canvas',
      'AI automation platform',
      'business process automation',
      'AI agent orchestration',
      'LLM workflow builder',
      'AI pipeline builder',
      'multi-agent system',
      'agentic workflow',
      'AI tools integration',
      'workflow designer',
      'intelligent automation',
      'AI agent evaluation',
      'real-time collaboration AI',
      'open source AI builder',
    ],
    referrer: 'origin-when-cross-origin',
    creator: brand.name,
    publisher: brand.name,
    metadataBase: new URL(baseUrl),
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
        'max-video-preview': -1,
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: baseUrl,
      title: defaultTitle,
      description: defaultDescription,
      siteName: brand.name,
      images: [
        {
          url: brand.logoUrl || getAssetUrl('social/og-preview.png'),
          width: 1200,
          height: 630,
          alt: `${brand.name} — Visual AI Agent Builder`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: defaultDescription,
      images: [brand.logoUrl || getAssetUrl('social/og-preview.png')],
      creator: '@zelaxy',
      site: '@zelaxy',
    },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [
        { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        {
          url: '/favicon/favicon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          url: '/favicon/favicon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        { url: brand.faviconUrl || '/social/og-preview.png', sizes: 'any', type: 'image/png' },
      ],
      apple: '/favicon/apple-touch-icon.png',
      shortcut: brand.faviconUrl || '/favicon/favicon.ico',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: brand.name,
    },
    formatDetection: {
      telephone: false,
    },
    category: 'technology',
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': brand.primaryColor || '#ffffff',
      'msapplication-config': '/favicon/browserconfig.xml',
    },
    ...override,
  }
}

/**
 * SoftwareApplication structured data (JSON-LD)
 */
export function generateStructuredData() {
  const brand = getBrandConfig()
  const baseUrl = env.NEXT_PUBLIC_APP_URL || SITE_URL

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: brand.name,
    alternateName: 'Zelaxy AI Agent Builder',
    description:
      'Build, test, and deploy AI agents on a visual drag-and-drop canvas. 78+ blocks, 80+ tools, real-time collaboration, and one-click deployment — no code required.',
    url: baseUrl,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Artificial Intelligence',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: 'SaaS',
    },
    creator: {
      '@type': 'Organization',
      name: brand.name,
      url: baseUrl,
      logo: `${baseUrl}/social/og-preview.png`,
      sameAs: [
        'https://github.com/manu14357/Zelaxy',
        'https://x.com/zelaxy',
      ],
    },
    featureList: [
      'Visual drag-and-drop AI agent builder',
      'Workflow canvas with 78+ blocks',
      '80+ pre-built tool integrations',
      'Real-time multi-user collaboration',
      'One-click agent deployment',
      'AI agent evaluation and testing',
      'Custom block and tool SDK',
      'Self-hostable open-source platform',
    ],
    screenshot: `${baseUrl}/social/og-preview.png`,
    softwareVersion: '1.0',
    releaseNotes: 'Initial public release',
  }
}

/**
 * Organization structured data (JSON-LD)
 */
export function generateOrganizationData() {
  const brand = getBrandConfig()
  const baseUrl = env.NEXT_PUBLIC_APP_URL || SITE_URL

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: baseUrl,
    logo: `${baseUrl}/social/og-preview.png`,
    description:
      'Open-source AI agent builder and workflow automation platform.',
    email: brand.supportEmail,
    sameAs: [
      'https://github.com/manu14357/Zelaxy',
      'https://x.com/zelaxy',
    ],
  }
}

/**
 * WebSite structured data with search action (JSON-LD)
 */
export function generateWebsiteData() {
  const brand = getBrandConfig()
  const baseUrl = env.NEXT_PUBLIC_APP_URL || SITE_URL

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.name,
    url: baseUrl,
    description:
      'Build, test, and deploy AI agents on a visual drag-and-drop canvas.',
    publisher: {
      '@type': 'Organization',
      name: brand.name,
      logo: `${baseUrl}/social/og-preview.png`,
    },
  }
}
