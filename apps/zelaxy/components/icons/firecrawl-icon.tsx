import type { SVGProps } from 'react'

export function FirecrawlIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <defs>
        <linearGradient id='firecrawlGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#FF6B35' />
          <stop offset='100%' stopColor='#FF2D00' />
        </linearGradient>
      </defs>
      <path
        d='M12 2c-1 0-2 .5-2.5 1.5L7 8l2 1 1.5-2.5c.2-.3.5-.5.8-.5s.6.2.8.5L14 10l2-1-2.5-5C13 2.5 12 2 12 2z'
        fill='url(#firecrawlGradient)'
      />
      <path d='M8 9l-3 6c-.5 1 0 2 1 2h2l1-2-1-1 2-3-2-2z' fill='#FF8A50' />
      <path d='M16 9l3 6c.5 1 0 2-1 2h-2l-1-2 1-1-2-3 2-2z' fill='#FF8A50' />
      <circle cx='12' cy='18' r='2' fill='#FFD700' />
      <path d='M10 20h4v2h-4z' fill='#FFA500' />
    </svg>
  )
}
