import type { Sponsor, SponsorTier, SponsorsByTier } from '@/types/sponsors'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const GITHUB_LOGIN = 'manu14357'

/** Map a dollar amount to a sponsor tier */
export function amountToTier(monthlyAmount: number): SponsorTier {
  if (monthlyAmount >= 1000) return 'diamond'
  if (monthlyAmount >= 500) return 'platinum'
  if (monthlyAmount >= 250) return 'gold'
  if (monthlyAmount >= 100) return 'silver'
  if (monthlyAmount >= 50) return 'bronze'
  if (monthlyAmount >= 15) return 'supporter'
  return 'backer'
}

/** Fetch sponsors from GitHub GraphQL API */
export async function fetchSponsors(): Promise<Sponsor[]> {
  const token = process.env.GITHUB_SPONSORS_TOKEN
  if (!token) {
    return getStaticSponsors()
  }

  try {
    const query = `
      query {
        user(login: "${GITHUB_LOGIN}") {
          sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
            totalCount
            nodes {
              sponsorEntity {
                ... on User {
                  login
                  name
                  avatarUrl
                  websiteUrl
                }
                ... on Organization {
                  login
                  name
                  avatarUrl
                  websiteUrl
                }
              }
              tier {
                monthlyPriceInDollars
              }
              createdAt
            }
          }
        }
      }
    `

    const res = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      console.error('GitHub Sponsors API error:', res.status)
      return getStaticSponsors()
    }

    const data = await res.json()
    const nodes = data?.data?.user?.sponsorshipsAsMaintainer?.nodes ?? []

    return nodes.map(
      (node: {
        sponsorEntity: { login: string; name: string; avatarUrl: string; websiteUrl?: string }
        tier: { monthlyPriceInDollars: number }
        createdAt: string
      }): Sponsor => ({
        login: node.sponsorEntity.login,
        name: node.sponsorEntity.name || node.sponsorEntity.login,
        avatarUrl: node.sponsorEntity.avatarUrl,
        websiteUrl: node.sponsorEntity.websiteUrl || undefined,
        tier: amountToTier(node.tier.monthlyPriceInDollars),
        monthlyAmount: node.tier.monthlyPriceInDollars,
        createdAt: node.createdAt,
      })
    )
  } catch (err) {
    console.error('Failed to fetch sponsors:', err)
    return getStaticSponsors()
  }
}

/** Group sponsors by tier, sorted by amount descending within each tier */
export function categorizeSponsorsByTier(sponsors: Sponsor[]): SponsorsByTier {
  const byTier: SponsorsByTier = {
    diamond: [],
    platinum: [],
    gold: [],
    silver: [],
    bronze: [],
    supporter: [],
    backer: [],
  }

  for (const sponsor of sponsors) {
    byTier[sponsor.tier].push(sponsor)
  }

  // Sort each tier by amount descending
  for (const tier of Object.keys(byTier) as SponsorTier[]) {
    byTier[tier].sort((a, b) => b.monthlyAmount - a.monthlyAmount)
  }

  return byTier
}

/** Calculate total monthly sponsorship amount */
export function getTotalMonthlyAmount(sponsors: Sponsor[]): number {
  return sponsors.reduce((sum, s) => sum + s.monthlyAmount, 0)
}

/** Static fallback sponsors for development and self-hosted deployments */
function getStaticSponsors(): Sponsor[] {
  return [
    {
      login: 'your-first-sponsor',
      name: 'Be the first sponsor!',
      avatarUrl: 'https://github.com/ghost.png',
      websiteUrl: 'https://github.com/sponsors/manu14357',
      tier: 'backer',
      monthlyAmount: 5,
    },
  ]
}
