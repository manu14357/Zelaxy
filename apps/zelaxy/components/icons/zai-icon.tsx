import type { SVGProps } from 'react'

export function ZaiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#2D2D2D' width='24' height='24' rx='4' />
      <path d='M7 7h10l-6.6 8.2H17V17H7l6.6-8.2H7V7z' fill='#fff' />
    </svg>
  )
}
