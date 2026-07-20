import type { ReactNode } from 'react'
import { DocsLayout } from 'fumadocs-ui/layouts/notebook'
import { BookOpen, Github, Heart, House, Map as MapIcon } from 'lucide-react'
import { source } from '@/lib/source'
import { DocsFooter } from '../components/footer'
import { NavbarCTA } from '../components/navbar-cta'

function ZelaxyLogo() {
  return (
    <div className='group flex items-center gap-2.5'>
      <div className='relative'>
        <img
          src='https://zelaxy.in/Zelaxy.png'
          alt='Zelaxy'
          width={22}
          height={22}
          className='h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-110'
        />
        <span className='-inset-1 absolute rounded-full bg-orange-500/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100' />
      </div>
      <div className='flex items-baseline gap-1.5'>
        <span className='font-semibold text-[15px] text-neutral-900 tracking-[-0.025em] dark:text-white'>
          Zelaxy
        </span>
        <span className='font-medium text-[11px] text-orange-500/80 uppercase tracking-wide dark:text-orange-400/60'>
          Docs
        </span>
      </div>
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: <ZelaxyLogo />,
        url: '/docs',
        mode: 'top',
      }}
      // n8n-style: root sections (Get Started, Blocks, Tools, Triggers, Guides,
      // Enterprise) render as a horizontal tab row beneath the navbar.
      tabMode='navbar'
      links={[
        {
          type: 'main',
          text: 'Home',
          url: 'https://zelaxy.in',
          icon: <House style={{ width: 15, height: 15 }} />,
        },
        {
          type: 'menu',
          text: 'Resources',
          items: [
            {
              icon: <BookOpen />,
              text: 'Getting Started',
              description: 'Build your first AI workflow',
              url: '/docs',
            },
            {
              icon: <MapIcon />,
              text: 'Core Concepts',
              description: 'Blocks, connections & variables',
              url: '/docs#core-concepts',
            },
            {
              icon: <Github />,
              text: 'GitHub',
              description: 'Source code & issues',
              url: 'https://github.com/manu14357/Zelaxy',
            },
            {
              icon: <Heart />,
              text: 'Sponsor',
              description: 'Support the project',
              url: 'https://github.com/sponsors/manu14357',
            },
          ],
        },
        {
          type: 'custom',
          on: 'nav',
          secondary: true,
          children: <NavbarCTA />,
        },
      ]}
      themeSwitch={{
        enabled: true,
        mode: 'light-dark',
      }}
      sidebar={{
        defaultOpenLevel: 1,
        // Always-visible sidebar on desktop (no collapse toggle); still a slide-in drawer on mobile.
        collapsible: false,
      }}
      githubUrl='https://github.com/manu14357/Zelaxy'
    >
      {children}
      <DocsFooter />
    </DocsLayout>
  )
}
