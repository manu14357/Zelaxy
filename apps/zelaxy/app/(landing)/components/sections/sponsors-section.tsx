'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Heart, Sparkles } from 'lucide-react'
import Image from 'next/image'
import type { Sponsor, SponsorsByTier } from '@/types/sponsors'
import { GITHUB_SPONSORS_URL, SPONSORS_GOAL_AMOUNT, SPONSOR_TIERS } from '@/types/sponsors'

interface SponsorsData {
  sponsors: Sponsor[]
  byTier: SponsorsByTier
  totalCount: number
  totalMonthly: number
  goalAmount: number
  goalProgress: number
}

export function SponsorsSection() {
  const [data, setData] = useState<SponsorsData | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true)
        })
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetch('/api/sponsors')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const hasSponsors =
    data && data.sponsors.length > 0 && data.sponsors[0].login !== 'your-first-sponsor'
  const goalProgress = data?.goalProgress ?? 0
  const totalMonthly = data?.totalMonthly ?? 0

  return (
    <section ref={sectionRef} className='relative bg-[#060606] py-24'>
      {/* Ambient glow */}
      <div className='-translate-x-1/2 pointer-events-none absolute top-0 left-1/2 h-96 w-[600px] rounded-full bg-primary/5 blur-[120px]' />

      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div
          className={`mb-16 text-center transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-[13px] text-pink-300'>
            <Heart className='h-3.5 w-3.5 fill-pink-400 text-pink-400' />
            Open Source Sponsors
          </div>
          <h2 className='mb-4 font-bold text-4xl text-white tracking-[-0.03em] sm:text-5xl'>
            Backed by{' '}
            <span className='bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent'>
              amazing sponsors
            </span>
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-neutral-400'>
            Zelaxy is free and open source. Sponsors help sustain development and keep the project
            growing. Your support makes a real difference.
          </p>
        </div>

        {/* Goal Progress */}
        <div
          className={`mx-auto mb-16 max-w-xl transition-all delay-200 duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className='rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6'>
            <div className='mb-3 flex items-center justify-between'>
              <span className='font-medium text-sm text-white'>Monthly Goal</span>
              <span className='font-mono text-sm text-neutral-400'>
                ${totalMonthly.toLocaleString()} / ${SPONSORS_GOAL_AMOUNT.toLocaleString()}
              </span>
            </div>
            <div className='h-3 overflow-hidden rounded-full bg-white/[0.06]'>
              <div
                className='h-full rounded-full bg-gradient-to-r from-pink-500 to-orange-500 transition-all duration-1000 ease-out'
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className='mt-3 text-center text-[13px] text-neutral-500'>
              {goalProgress < 100
                ? "Help us reach full-time open source — I'll be able to quit my job and work on Zelaxy and other projects full time!"
                : 'Goal reached! Thank you to all our amazing sponsors!'}
            </p>
          </div>
        </div>

        {/* Sponsor Tiers */}
        {hasSponsors && data ? (
          <div
            className={`mb-16 space-y-12 transition-all delay-300 duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {/* Diamond & Platinum — large logos */}
            {[...data.byTier.diamond, ...data.byTier.platinum].length > 0 && (
              <div className='text-center'>
                <div className='mb-6 flex items-center justify-center gap-2'>
                  <Sparkles className='h-4 w-4 text-amber-400' />
                  <span className='font-semibold text-sm text-neutral-300 uppercase tracking-wider'>
                    Premium Sponsors
                  </span>
                </div>
                <div className='flex flex-wrap items-center justify-center gap-8'>
                  {[...data.byTier.diamond, ...data.byTier.platinum].map((sponsor) => (
                    <SponsorCard key={sponsor.login} sponsor={sponsor} size='lg' />
                  ))}
                </div>
              </div>
            )}

            {/* Gold — medium logos */}
            {data.byTier.gold.length > 0 && (
              <div className='text-center'>
                <div className='mb-5 flex items-center justify-center gap-2'>
                  <span
                    className='inline-block h-2 w-2 rounded-full'
                    style={{ backgroundColor: SPONSOR_TIERS.gold.color }}
                  />
                  <span className='font-medium text-xs text-neutral-400 uppercase tracking-wider'>
                    Gold Sponsors
                  </span>
                </div>
                <div className='flex flex-wrap items-center justify-center gap-6'>
                  {data.byTier.gold.map((sponsor) => (
                    <SponsorCard key={sponsor.login} sponsor={sponsor} size='md' />
                  ))}
                </div>
              </div>
            )}

            {/* Silver & Bronze — small logos */}
            {[...data.byTier.silver, ...data.byTier.bronze].length > 0 && (
              <div className='text-center'>
                <div className='mb-4 flex items-center justify-center gap-2'>
                  <span className='inline-block h-2 w-2 rounded-full bg-neutral-400' />
                  <span className='font-medium text-xs text-neutral-400 uppercase tracking-wider'>
                    Sponsors
                  </span>
                </div>
                <div className='flex flex-wrap items-center justify-center gap-4'>
                  {[...data.byTier.silver, ...data.byTier.bronze].map((sponsor) => (
                    <SponsorCard key={sponsor.login} sponsor={sponsor} size='sm' />
                  ))}
                </div>
              </div>
            )}

            {/* Supporters & Backers — avatar row */}
            {[...data.byTier.supporter, ...data.byTier.backer].length > 0 && (
              <div className='text-center'>
                <div className='mb-4 flex items-center justify-center gap-2'>
                  <Heart className='h-3 w-3 text-pink-400' />
                  <span className='font-medium text-xs text-neutral-400 uppercase tracking-wider'>
                    Backers & Supporters
                  </span>
                </div>
                <div className='flex flex-wrap items-center justify-center gap-2'>
                  {[...data.byTier.supporter, ...data.byTier.backer].map((sponsor) => (
                    <a
                      key={sponsor.login}
                      href={
                        sponsor.websiteUrl ||
                        `https://github.com/${encodeURIComponent(sponsor.login)}`
                      }
                      target='_blank'
                      rel='noopener noreferrer'
                      title={`${sponsor.name} — ${SPONSOR_TIERS[sponsor.tier].label}`}
                      className='group relative'
                    >
                      <Image
                        src={sponsor.avatarUrl}
                        alt={sponsor.name}
                        width={36}
                        height={36}
                        className='rounded-full border border-white/10 transition-all duration-200 group-hover:scale-110 group-hover:border-pink-400/50'
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div
            className={`mb-16 text-center transition-all delay-300 duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <div className='mx-auto max-w-md rounded-2xl border border-dashed border-white/10 p-12'>
              <Heart className='mx-auto mb-4 h-10 w-10 text-neutral-600' />
              <p className='mb-2 font-medium text-neutral-300'>Be the first sponsor</p>
              <p className='text-sm text-neutral-500'>
                Your logo and name will appear here. Support open-source AI workflow automation.
              </p>
            </div>
          </div>
        )}

        {/* Sponsor Tiers Table */}
        <div
          className={`mb-16 transition-all delay-400 duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h3 className='mb-8 text-center font-semibold text-2xl text-white'>Sponsorship Tiers</h3>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {(
              ['diamond', 'platinum', 'gold', 'silver', 'bronze', 'supporter', 'backer'] as const
            ).map((tier) => {
              const config = SPONSOR_TIERS[tier]
              return (
                <div
                  key={tier}
                  className='group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]'
                >
                  <div className='mb-3 flex items-center gap-2'>
                    <span
                      className='inline-block h-2.5 w-2.5 rounded-full'
                      style={{ backgroundColor: config.color }}
                    />
                    <span className='font-semibold text-sm text-white'>{config.label}</span>
                  </div>
                  <div className='mb-3 font-mono text-2xl text-white'>
                    ${config.minAmount}
                    <span className='text-neutral-500 text-sm'>/mo</span>
                  </div>
                  <ul className='space-y-1.5'>
                    {config.perks.map((perk) => (
                      <li key={perk} className='flex items-start gap-2 text-[13px] text-neutral-400'>
                        <span className='mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-neutral-600' />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div
          className={`text-center transition-all delay-500 duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <a
            href={GITHUB_SPONSORS_URL}
            target='_blank'
            rel='noopener noreferrer'
            className='group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-pink-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/30'
          >
            <Heart className='h-4 w-4 fill-white' />
            Become a Sponsor
            <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
          </a>
          <p className='mt-4 text-[13px] text-neutral-500'>
            Every contribution helps — from $5/mo backers to enterprise sponsors
          </p>
        </div>
      </div>
    </section>
  )
}

function SponsorCard({
  sponsor,
  size,
}: {
  sponsor: Sponsor
  size: 'lg' | 'md' | 'sm'
}) {
  const imgSize = size === 'lg' ? 80 : size === 'md' ? 56 : 40
  const tierConfig = SPONSOR_TIERS[sponsor.tier]

  return (
    <a
      href={
        sponsor.websiteUrl || `https://github.com/${encodeURIComponent(sponsor.login)}`
      }
      target='_blank'
      rel='noopener noreferrer'
      className='group flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]'
      title={`${sponsor.name} — ${tierConfig.label} Sponsor`}
    >
      <Image
        src={sponsor.avatarUrl}
        alt={sponsor.name}
        width={imgSize}
        height={imgSize}
        className='rounded-full border-2 transition-transform duration-200 group-hover:scale-105'
        style={{ borderColor: tierConfig.color }}
      />
      <div className='text-center'>
        <div
          className={`font-medium text-white ${
            size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'
          }`}
        >
          {sponsor.name}
        </div>
        <div className='text-[11px]' style={{ color: tierConfig.color }}>
          {tierConfig.label}
        </div>
      </div>
    </a>
  )
}
