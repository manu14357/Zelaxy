import { NextResponse } from 'next/server'
import { categorizeSponsorsByTier, fetchSponsors, getTotalMonthlyAmount } from '@/lib/sponsors'
import { SPONSORS_GOAL_AMOUNT } from '@/types/sponsors'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  const sponsors = await fetchSponsors()
  const byTier = categorizeSponsorsByTier(sponsors)
  const totalMonthly = getTotalMonthlyAmount(sponsors)

  return NextResponse.json({
    sponsors,
    byTier,
    totalCount: sponsors.length,
    totalMonthly,
    goalAmount: SPONSORS_GOAL_AMOUNT,
    goalProgress: Math.min(Math.round((totalMonthly / SPONSORS_GOAL_AMOUNT) * 100), 100),
    sponsorUrl: 'https://github.com/sponsors/manu14357',
  })
}
