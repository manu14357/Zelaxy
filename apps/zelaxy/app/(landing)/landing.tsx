'use client'

import '@/app/(landing)/components/blueprint.css'

import { Footer } from '@/app/(landing)/components'
import { AnnouncementBar } from '@/app/(landing)/components/announcement-bar'
import { Navigation } from '@/app/(landing)/components/navigation'
import { CanvasSection } from '@/app/(landing)/components/sections/canvas-section'
import { CapabilitiesSection } from '@/app/(landing)/components/sections/capabilities-section'
import { CTASection } from '@/app/(landing)/components/sections/cta-section'
import { DeveloperSection } from '@/app/(landing)/components/sections/developer-section'
import { EcosystemSection } from '@/app/(landing)/components/sections/ecosystem-section'
import { EnterpriseSection } from '@/app/(landing)/components/sections/enterprise-section'
import { HeroSection } from '@/app/(landing)/components/sections/hero-section'
import { LifecycleSection } from '@/app/(landing)/components/sections/lifecycle-section'
import { ManifestoSection } from '@/app/(landing)/components/sections/manifesto-section'
import { OpenSection } from '@/app/(landing)/components/sections/open-section'

export default function Landing() {
  return (
    <main className='s-bg t-ink relative min-h-screen overflow-x-hidden'>
      <AnnouncementBar />
      <Navigation />

      <HeroSection />
      <ManifestoSection />
      <CanvasSection />
      <LifecycleSection />
      <CapabilitiesSection />
      <EcosystemSection />
      <EnterpriseSection />
      <DeveloperSection />
      <OpenSection />
      <CTASection />

      <Footer />
    </main>
  )
}
