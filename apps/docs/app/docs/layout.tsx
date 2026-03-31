import type { ReactNode } from 'react'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { Blocks, ExternalLink, Wrench, Zap } from 'lucide-react'
import { source } from '@/lib/source'
import { DocsFooter } from '../components/footer'

function ZelaxyLogo() {
  return (
    <div className='group flex items-center gap-2.5'>
      <img
        src='https://zelaxy.in/Zelaxy.png'
        alt='Zelaxy'
        width={22}
        height={22}
        className='h-5.5 w-5.5'
      />
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

function SidebarBanner() {
  return (
    <div className='mb-4 space-y-3'>
      {/* Platform stats */}
      <div className='rounded-xl border border-orange-200/40 bg-gradient-to-br from-orange-50/80 to-amber-50/40 px-3.5 py-3 dark:border-orange-900/30 dark:from-orange-950/20 dark:to-amber-950/10'>
        <p className='font-semibold text-[11px] text-orange-600/80 uppercase tracking-[0.1em] dark:text-orange-400/70'>
          Platform
        </p>
        <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1'>
          <span className='inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400'>
            <span className='inline-block h-1.5 w-1.5 rounded-full bg-blue-400' />
            78+ blocks
          </span>
          <span className='inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400'>
            <span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-400' />
            80+ tools
          </span>
          <span className='inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400'>
            <span className='inline-block h-1.5 w-1.5 rounded-full bg-orange-400' />
            Visual builder
          </span>
        </div>
      </div>

      {/* Quick link */}
      <a
        href='https://zelaxy.in'
        className='flex items-center gap-2 rounded-lg border border-neutral-200/50 bg-neutral-50/50 px-3 py-2 font-medium text-[12px] text-neutral-500 transition-all duration-200 hover:border-orange-200/50 hover:text-orange-600 dark:border-neutral-800/50 dark:bg-neutral-900/30 dark:text-neutral-400 dark:hover:border-orange-800/30 dark:hover:text-orange-400'
      >
        <ExternalLink style={{ width: 12, height: 12 }} />
        Open Zelaxy App
      </a>
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
      }}
      links={[
        {
          type: 'main',
          text: 'Blocks',
          url: '/docs/blocks',
          icon: <Blocks style={{ width: 15, height: 15, color: '#3b82f6' }} />,
          active: 'nested-url',
        },
        {
          type: 'main',
          text: 'Tools',
          url: '/docs/tools',
          icon: <Wrench style={{ width: 15, height: 15, color: '#10b981' }} />,
          active: 'nested-url',
        },
        {
          type: 'main',
          text: 'Triggers',
          url: '/docs/triggers',
          icon: <Zap style={{ width: 15, height: 15, color: '#ef4444' }} />,
          active: 'nested-url',
        },
      ]}
      themeSwitch={{
        enabled: true,
        mode: 'light-dark',
      }}
      sidebar={{
        defaultOpenLevel: 1,
        banner: <SidebarBanner />,
      }}
      githubUrl='https://github.com/zelaxy-ai/zelaxy'
    >
      {children}
      <DocsFooter />
    </DocsLayout>
  )
}
