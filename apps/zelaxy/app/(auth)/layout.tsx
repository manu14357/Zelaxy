'use client'

import { useBrandConfig } from '@/lib/branding/branding'
import '@/app/(landing)/components/animations.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = useBrandConfig()

  return (
    <main className='relative flex min-h-screen flex-col overflow-hidden bg-[#060606] font-geist-sans text-white'>
      {/* Background gradient */}
      <div className='absolute inset-0'>
        <div className='absolute inset-0 bg-gradient-to-b from-[#060606] via-[#0a0a0a] to-[#060606]' />
      </div>

      {/* Subtle grid */}
      <div
        className='pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]'
        style={{
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 50% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* Radial glow */}
      <div className='-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/3 left-1/2 h-[500px] w-[700px] rounded-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl' />

      {/* Content */}
      <div className='relative z-10 flex flex-1'>
        <div className='w-full'>{children}</div>
      </div>
    </main>
  )
}
