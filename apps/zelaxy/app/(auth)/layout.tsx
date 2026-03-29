'use client'

import { useBrandConfig } from '@/lib/branding/branding'
import '@/app/(landing)/components/animations.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = useBrandConfig()

  return (
    <main className='relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 font-geist-sans text-gray-900 transition-colors duration-500 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900/20 dark:text-white'>
      {/* Enhanced Background Elements */}
      <div className='absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 transition-colors duration-500 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900/20' />

      {/* Animated mesh gradient background */}
      <div className='absolute inset-0 opacity-30 dark:opacity-20'>
        <div className='absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-primary/30 to-orange-600/30 blur-3xl [animation-duration:4s]' />
        <div className='absolute top-1/3 right-1/4 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-purple-400/30 to-pink-600/30 blur-3xl [animation-delay:2s] [animation-duration:6s]' />
        <div className='absolute bottom-1/4 left-1/3 h-72 w-72 animate-pulse rounded-full bg-gradient-to-r from-orange-400/30 to-primary/30 blur-3xl [animation-delay:1s] [animation-duration:5s]' />
      </div>

      {/* Grid pattern overlay */}
      <div className='absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(rgba(251,146,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.03)_1px,transparent_1px)]' />

      {/* Floating decorative orbs */}
      <div className='absolute top-16 right-10 hidden lg:block'>
        <div className='h-4 w-4 animate-pulse rounded-full bg-gradient-to-r from-primary to-orange-400 shadow-lg shadow-primary/50 dark:shadow-primary/30' />
      </div>
      <div className='absolute top-1/2 left-20 hidden lg:block'>
        <div className='h-3 w-3 animate-bounce rounded-full bg-gradient-to-r from-purple-400 to-pink-400 shadow-lg shadow-primary/50 [animation-delay:1s] dark:shadow-primary/30' />
      </div>
      <div className='absolute right-10 bottom-1/3 hidden lg:block'>
        <div className='h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-orange-400 shadow-lg shadow-primary/50 [animation-delay:2s] dark:shadow-primary/30' />
      </div>
      <div className='absolute bottom-20 left-20 hidden lg:block'>
        <div className='h-5 w-5 animate-bounce rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg shadow-yellow-400/50 [animation-delay:3s] [animation-duration:4s] dark:shadow-yellow-400/30' />
      </div>

      {/* Content */}
      <div className='relative z-10 flex flex-1'>
        <div className='w-full'>{children}</div>
      </div>
    </main>
  )
}
