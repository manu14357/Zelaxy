import { cn } from '@/lib/utils'

interface ZelaxyLogoProps {
  className?: string
  size?: number
  showGlow?: boolean
  variant?: 'default' | 'blue'
}

export function ZelaxyLogo({ className, size = 24, showGlow = false }: ZelaxyLogoProps) {
  return (
    <div className={cn('group relative inline-flex items-center justify-center', className)}>
      <div className={cn('flex items-center justify-center', showGlow && 'relative')}>
        <img
          src='/Zelaxy.png'
          alt='Zelaxy'
          width={size}
          height={size}
          className={cn(
            'transition-all duration-300',
            showGlow && 'transition-all duration-500 group-hover:scale-110'
          )}
        />
      </div>
      {showGlow && (
        <div className='-inset-2 absolute rounded-full bg-gradient-to-r from-primary/20 via-orange-600/20 to-primary/20 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100' />
      )}
    </div>
  )
}
