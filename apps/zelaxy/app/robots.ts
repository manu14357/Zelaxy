import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'https://zelaxy.in'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/terms'],
        disallow: [
          '/api/',
          '/arena/',
          '/chat/',
          '/embed/',
          '/invite/',
          '/login',
          '/signup',
          '/verify',
          '/reset-password',
          '/unsubscribe/',
          '/test-logo/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
