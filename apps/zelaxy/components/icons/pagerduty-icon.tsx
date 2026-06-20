import type { SVGProps } from 'react'

export function PagerDutyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#06AC38' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M8 5h4.5c2.5 0 4 1.4 4 3.7s-1.5 3.8-4 3.8H10v4.5H8V5zm2 1.9v3.7h2.3c1.3 0 2.1-.7 2.1-1.9S13.6 6.9 12.3 6.9H10z'
      />
    </svg>
  )
}
