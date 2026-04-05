'use client'

import '@/app/(landing)/components/animations.css'

import { Footer } from '@/app/(landing)/components'
import { Navigation } from '@/app/(landing)/components/navigation'
import { CTASection } from '@/app/(landing)/components/sections/cta-section'
import { FeaturesSection } from '@/app/(landing)/components/sections/features-section'
import { HeroSection } from '@/app/(landing)/components/sections/hero-section'
import { HowItWorksSection } from '@/app/(landing)/components/sections/how-it-works-section'
import { IntegrationsSection } from '@/app/(landing)/components/sections/integrations-section'

export default function Landing() {
  return (
    <main className='relative min-h-screen overflow-x-hidden bg-white text-neutral-900 dark:bg-[#060606] dark:text-white'>
      <Navigation />

      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <IntegrationsSection />
      <CTASection />

      <Footer />
    </main>
  )
}
