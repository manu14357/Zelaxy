export type SponsorTier =
  | 'diamond'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'supporter'
  | 'backer'

export interface Sponsor {
  login: string
  name: string
  avatarUrl: string
  websiteUrl?: string
  tier: SponsorTier
  monthlyAmount: number
  createdAt?: string
}

export interface SponsorsByTier {
  diamond: Sponsor[]
  platinum: Sponsor[]
  gold: Sponsor[]
  silver: Sponsor[]
  bronze: Sponsor[]
  supporter: Sponsor[]
  backer: Sponsor[]
}

export const SPONSOR_TIERS: Record<
  SponsorTier,
  { label: string; minAmount: number; color: string; perks: string[] }
> = {
  diamond: {
    label: 'Diamond',
    minAmount: 1000,
    color: '#b9f2ff',
    perks: [
      'Co-branding opportunity',
      '1:1 monthly call',
      'All lower-tier perks',
    ],
  },
  platinum: {
    label: 'Platinum',
    minAmount: 500,
    color: '#e5e4e2',
    perks: [
      'Custom block icon in arena',
      'All lower-tier perks',
    ],
  },
  gold: {
    label: 'Gold',
    minAmount: 250,
    color: '#ffd700',
    perks: [
      'Large logo everywhere',
      'Priority issue support',
      'All lower-tier perks',
    ],
  },
  silver: {
    label: 'Silver',
    minAmount: 100,
    color: '#c0c0c0',
    perks: ['Logo everywhere', 'Early access to features', 'All lower-tier perks'],
  },
  bronze: {
    label: 'Bronze',
    minAmount: 50,
    color: '#cd7f32',
    perks: ['Logo on README, website, and docs'],
  },
  supporter: {
    label: 'Supporter',
    minAmount: 15,
    color: '#f97316',
    perks: ['Name + link on README, website, and docs'],
  },
  backer: {
    label: 'Backer',
    minAmount: 5,
    color: '#a78bfa',
    perks: ['Name on README + website'],
  },
}

export const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/manu14357'
export const SPONSORS_GOAL_AMOUNT = 5000
