import type { MetadataRoute } from 'next'
import { getBrandConfig } from '@/lib/branding/branding'

export default function manifest(): MetadataRoute.Manifest {
  const brand = getBrandConfig()

  return {
    name: brand.name,
    short_name: brand.name,
    description:
      'Revolutionary AI-powered workflow automation platform that transforms complex business processes into elegant, visual workflows. Build sophisticated automation pipelines with zero-code simplicity, AI-native architecture, and infinite extensibility.',
    start_url: '/',
    display: 'standalone',
    background_color: brand.primaryColor || '#ffffff',
    theme_color: brand.primaryColor || '#ffffff',
    icons: [
      {
        src: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
