import type { MetadataRoute } from 'next'
import { getBrandConfig } from '@/lib/branding/branding'

export default function manifest(): MetadataRoute.Manifest {
  const brand = getBrandConfig()

  return {
    name: `${brand.name} — Visual AI Agent Builder`,
    short_name: brand.name,
    description:
      'Build, test, and deploy AI agents on a visual drag-and-drop canvas. 78+ blocks, 80+ tools, real-time collaboration, and one-click deployment — no code required.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: brand.primaryColor || '#000000',
    categories: ['productivity', 'business', 'developer tools'],
    icons: [
      {
        src: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
