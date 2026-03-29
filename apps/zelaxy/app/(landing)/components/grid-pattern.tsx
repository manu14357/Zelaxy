'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

interface GridPatternProps {
  x?: number
  y?: number
  width?: number
  height?: number
  className?: string
  'aria-hidden'?: boolean
}

export function GridPattern({
  x = 0,
  y = 0,
  width = 40,
  height = 40,
  className,
  ...props
}: GridPatternProps) {
  const id = useId()
  const patternId = `grid-pattern-${id}`

  return (
    <svg className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} {...props}>
      <defs>
        <pattern
          id={patternId}
          x={x}
          y={y}
          width={width}
          height={height}
          patternUnits='userSpaceOnUse'
        >
          <path
            d={`M ${width} 0 L 0 0 L 0 ${height}`}
            fill='none'
            stroke='currentColor'
            strokeWidth='1'
          />
        </pattern>
      </defs>
      <rect width='100%' height='100%' fill={`url(#${patternId})`} />
    </svg>
  )
}
