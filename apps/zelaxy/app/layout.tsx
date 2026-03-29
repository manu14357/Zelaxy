import type { Metadata, Viewport } from 'next'
import { PublicEnvScript } from 'next-runtime-env'
import { BrandedLayout } from '@/components/branded-layout'
import { generateBrandedMetadata, generateStructuredData } from '@/lib/branding/metadata'
import { createLogger } from '@/lib/logs/console/logger'
import { getAssetUrl } from '@/lib/utils'

import '@/app/globals.css'

import { ZoomPrevention } from '@/app/zoom-prevention'

const logger = createLogger('RootLayout')

const BROWSER_EXTENSION_ATTRIBUTES = [
  'data-new-gr-c-s-check-loaded',
  'data-gr-ext-installed',
  'data-gr-ext-disabled',
  'data-grammarly',
  'data-fgm',
  'data-lt-installed',
]

if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args) => {
    if (args[0].includes('Hydration')) {
      const isExtensionError = BROWSER_EXTENSION_ATTRIBUTES.some((attr) =>
        args.some((arg) => typeof arg === 'string' && arg.includes(attr))
      )

      if (!isExtensionError) {
        logger.error('Hydration Error', {
          details: args,
          componentStack: args.find(
            (arg) => typeof arg === 'string' && arg.includes('component stack')
          ),
        })
      }
    }
    originalError.apply(console, args)
  }
}

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Generate dynamic metadata based on brand configuration
export const metadata: Metadata = generateBrandedMetadata()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = generateStructuredData()

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        {/* Meta tags for better SEO */}
        <meta name='theme-color' content='#ffffff' />
        <meta name='color-scheme' content='light' />
        <meta name='format-detection' content='telephone=no' />
        <meta httpEquiv='x-ua-compatible' content='ie=edge' />

        {/* Additional Open Graph tags */}
        <meta property='og:image:width' content='1200' />
        <meta property='og:image:height' content='630' />
        <meta
          property='og:image:alt'
          content='Zelaxy - AI Agent Builder with Visual Canvas Interface'
        />
        <meta property='og:site_name' content='Zelaxy' />
        <meta property='og:locale' content='en_US' />

        {/* Twitter Card tags */}
        <meta name='twitter:image:width' content='1200' />
        <meta name='twitter:image:height' content='675' />
        <meta name='twitter:image:alt' content='Zelaxy - AI Agent Builder' />
        <meta name='twitter:url' content='https://zelaxy.in' />
        <meta name='twitter:domain' content='zelaxy.in' />

        {/* Additional image sources */}
        <link rel='image_src' href={getAssetUrl('social/facebook.png')} />

        <PublicEnvScript />
      </head>
      <body suppressHydrationWarning>
        <BrandedLayout>
          <ZoomPrevention />
          {children}
        </BrandedLayout>
      </body>
    </html>
  )
}
