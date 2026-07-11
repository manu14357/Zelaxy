import type { MetadataRoute } from 'next'
import { getBrandConfig } from '@/lib/branding/branding'

export default function manifest(): MetadataRoute.Manifest {
  const brand = getBrandConfig()

  return {
    name: `${brand.name} — Visual AI Agent Builder`,
    short_name: brand.name,
    description:
      'Zelaxy is the visual operating system for AI work. Compose agents, workflows, automation, reasoning and knowledge on one canvas — then deploy to production, together, in real time. No code required.',
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
