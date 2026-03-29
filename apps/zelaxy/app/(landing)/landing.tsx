'use client'

import {
  BlocksScrollSection,
  CTASection,
  FeaturesSection,
  Footer,
  HeroSection,
  HowItWorksSection,
} from '@/app/(landing)/components'
import { ThemeProvider } from '@/app/(landing)/components/theme-provider'
import { GitHubStarsBanner } from '@/app/(landing)/components/github-stars-banner'

export default function Landing() {
  return (
    <ThemeProvider defaultTheme='dark' storageKey='zelaxy-theme'>
      <main className='relative min-h-screen overflow-x-hidden bg-[#060606] text-white'>
        <GitHubStarsBanner />

        <HeroSection />
        <BlocksScrollSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CTASection />

        <Footer />
      </main>
    </ThemeProvider>
  )
}
