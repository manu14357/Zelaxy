'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import Image from 'next/image'
import { SponsorTierIcon } from '@/components/icons/sponsor-tiers'
import type { Sponsor } from '@/types/sponsors'
import { GITHUB_SPONSORS_URL, SPONSOR_TIERS } from '@/types/sponsors'

interface SponsorBadgeProps {
  /** Compact mode shows just the heart icon with count */
  compact?: boolean
}

export function SponsorBadge({ compact = false }: SponsorBadgeProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetch('/api/sponsors')
      .then((res) => res.json())
      .then((data) => {
        if (data?.sponsors) setSponsors(data.sponsors)
      })
      .catch(() => {})
  }, [])

  const topSponsors = sponsors.filter((s) => s.monthlyAmount >= 100).slice(0, 5)

  if (compact) {
    return (
      <a
        href={GITHUB_SPONSORS_URL}
        target='_blank'
        rel='noopener noreferrer'
        className='group inline-flex items-center gap-1.5 rounded-full border border-pink-500/20 bg-pink-500/10 px-2.5 py-1 text-[11px] text-pink-300 transition-all duration-200 hover:border-pink-500/30 hover:bg-pink-500/15'
        title='Sponsor Zelaxy on GitHub'
      >
        <Heart className='h-3 w-3 fill-pink-400 text-pink-400' />
        {sponsors.length > 0 ? `${sponsors.length} sponsors` : 'Sponsor'}
      </a>
    )
  }

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='group flex items-center gap-2 rounded-lg px-2 py-1.5 text-neutral-400 transition-colors hover:bg-muted/50 hover:text-neutral-200'
        title='Sponsors'
      >
        <Heart className='h-4 w-4 text-pink-400' />
        <span className='text-xs'>Sponsors</span>
      </button>

      {isOpen && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />
          <div className='absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-border bg-card p-4 shadow-xl'>
            <div className='mb-3 flex items-center justify-between'>
              <span className='font-medium text-foreground text-sm'>Sponsors</span>
              <a
                href={GITHUB_SPONSORS_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='text-[11px] text-pink-400 transition-colors hover:text-pink-300'
              >
                Become a sponsor
              </a>
            </div>

            {topSponsors.length > 0 ? (
              <div className='space-y-2'>
                {topSponsors.map((sponsor) => (
                  <a
                    key={sponsor.login}
                    href={
                      sponsor.websiteUrl ||
                      `https://github.com/${encodeURIComponent(sponsor.login)}`
                    }
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-muted/50'
                  >
                    <Image
                      src={sponsor.avatarUrl}
                      alt={sponsor.name}
                      width={28}
                      height={28}
                      className='rounded-full'
                    />
                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-foreground text-xs'>{sponsor.name}</div>
                      <div className='flex items-center gap-1'>
                        <SponsorTierIcon tier={sponsor.tier} size={10} />
                        <span
                          className='text-[10px]'
                          style={{ color: SPONSOR_TIERS[sponsor.tier].color }}
                        >
                          {SPONSOR_TIERS[sponsor.tier].label}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className='py-3 text-center'>
                <Heart className='mx-auto mb-2 h-6 w-6 text-neutral-600' />
                <p className='text-muted-foreground text-xs'>No sponsors yet. Be the first!</p>
              </div>
            )}

            {sponsors.length > 5 && (
              <div className='mt-2 border-border border-t pt-2 text-center'>
                <span className='text-[11px] text-muted-foreground'>
                  +{sponsors.length - 5} more sponsors
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
