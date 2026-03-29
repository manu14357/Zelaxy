import { cn } from '@/lib/utils'

interface ZelaxyLogoProps {
  className?: string
  size?: number
  showGlow?: boolean
  variant?: 'default' | 'blue'
}

export function ZelaxyLogo({
  className,
  size = 24,
  showGlow = false,
  variant = 'default',
}: ZelaxyLogoProps) {
  return (
    <div className={cn('group relative inline-flex items-center justify-center', className)}>
      <div className={cn('flex items-center justify-center', showGlow && 'relative')}>
        <svg
          width={size}
          height={size}
          viewBox='0 0 100 100'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className={cn(
            'transition-all duration-300',
            variant === 'blue' ? 'text-primary dark:text-primary/80' : 'text-primary',
            showGlow && 'transition-all duration-500 group-hover:scale-110'
          )}
        >
          <circle cx='50' cy='15' r='4' stroke='currentColor' strokeWidth='5' fill='none' />
          <path
            d='M50 15 L50 40'
            stroke='currentColor'
            strokeWidth='5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M50 40 L35 20'
            stroke='currentColor'
            strokeWidth='5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
          />
          <path
            d='M50 40 L65 20'
            stroke='currentColor'
            strokeWidth='5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
          />
          <path
            d='M35 20 L20 45 L20 75 Q20 82 30 85 L50 85'
            stroke='currentColor'
            strokeWidth='5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
          />
          <path
            d='M65 20 L80 45 L80 75 Q80 82 70 85 L50 85'
            stroke='currentColor'
            strokeWidth='5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
          />
          <circle cx='40' cy='55' r='4' fill='currentColor' />
          <circle cx='60' cy='55' r='4' fill='currentColor' />
          <path
            d='M40 68 Q50 76 60 68'
            stroke='currentColor'
            strokeWidth='5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
          />
        </svg>
      </div>
      {showGlow && (
        <div className='-inset-2 absolute rounded-full bg-gradient-to-r from-primary/20 via-orange-600/20 to-primary/20 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100' />
      )}
    </div>
  )
}
