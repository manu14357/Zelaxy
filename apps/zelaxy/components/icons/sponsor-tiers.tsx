import type { SponsorTier } from '@/types/sponsors'

interface TierIconProps {
  className?: string
  size?: number
}

export function DiamondTierIcon({ className, size = 16 }: TierIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <path
        d='M12 2L2 9l10 13L22 9l-10-7z'
        fill='#b9f2ff'
        fillOpacity={0.2}
        stroke='#b9f2ff'
        strokeWidth={1.5}
      />
      <path d='M2 9h20' stroke='#b9f2ff' strokeWidth={1.5} />
      <path d='M7 2l-5 7M17 2l5 7M12 2v7' stroke='#b9f2ff' strokeWidth={1.5} />
    </svg>
  )
}

export function PlatinumTierIcon({ className, size = 16 }: TierIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <path
        d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
        fill='#e5e4e2'
        fillOpacity={0.2}
        stroke='#e5e4e2'
        strokeWidth={1.5}
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function GoldTierIcon({ className, size = 16 }: TierIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <path
        d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
        fill='#ffd700'
        fillOpacity={0.2}
        stroke='#ffd700'
        strokeWidth={1.5}
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function SilverTierIcon({ className, size = 16 }: TierIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <circle
        cx={12}
        cy={12}
        r={9}
        fill='#c0c0c0'
        fillOpacity={0.15}
        stroke='#c0c0c0'
        strokeWidth={1.5}
      />
      <path d='M12 7v5l3 3' stroke='#c0c0c0' strokeWidth={1.5} strokeLinecap='round' />
    </svg>
  )
}

export function BronzeTierIcon({ className, size = 16 }: TierIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <circle
        cx={12}
        cy={12}
        r={9}
        fill='#cd7f32'
        fillOpacity={0.15}
        stroke='#cd7f32'
        strokeWidth={1.5}
      />
      <path d='M8 12h8M12 8v8' stroke='#cd7f32' strokeWidth={1.5} strokeLinecap='round' />
    </svg>
  )
}

export function SupporterTierIcon({ className, size = 16 }: TierIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <path
        d='M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'
        fill='#f97316'
        fillOpacity={0.2}
        stroke='#f97316'
        strokeWidth={1.5}
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function BackerTierIcon({ className, size = 16 }: TierIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <path
        d='M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'
        fill='#a78bfa'
        fillOpacity={0.2}
        stroke='#a78bfa'
        strokeWidth={1.5}
        strokeLinejoin='round'
      />
    </svg>
  )
}

const TIER_ICON_MAP: Record<SponsorTier, React.FC<TierIconProps>> = {
  diamond: DiamondTierIcon,
  platinum: PlatinumTierIcon,
  gold: GoldTierIcon,
  silver: SilverTierIcon,
  bronze: BronzeTierIcon,
  supporter: SupporterTierIcon,
  backer: BackerTierIcon,
}

export function SponsorTierIcon({ tier, ...props }: TierIconProps & { tier: SponsorTier }) {
  const Icon = TIER_ICON_MAP[tier]
  return <Icon {...props} />
}

/** Custom sponsor money icon — a coin with dollar sign */
export function SponsorMoneyIcon({ className, size = 16 }: TierIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      className={className}
      aria-hidden='true'
    >
      <circle
        cx='12'
        cy='12'
        r='10'
        fill='url(#sponsorCoinGrad)'
        stroke='#f59e0b'
        strokeWidth={1.5}
      />
      <path d='M12 6v12' stroke='#92400e' strokeWidth={1.5} strokeLinecap='round' />
      <path
        d='M9 8.5c0-1 1.5-1.5 3-1.5s3 .5 3 1.5-1.5 1.5-3 2-3 1-3 2 1.5 1.5 3 1.5 3-.5 3-1.5'
        stroke='#92400e'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <defs>
        <linearGradient id='sponsorCoinGrad' x1='2' y1='2' x2='22' y2='22'>
          <stop stopColor='#fbbf24' />
          <stop offset='1' stopColor='#f59e0b' />
        </linearGradient>
      </defs>
    </svg>
  )
}
