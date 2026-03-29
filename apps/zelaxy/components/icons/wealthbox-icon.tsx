import type { SVGProps } from 'react'

export function WealthboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#4A90D9' width='24' height='24' rx='4' />
      <path fill='#fff' d='M5.5 8l2.5 8 2-5 2 5 2.5-8h-2l-1.2 4-1.3-4h-1l-1.3 4L7 8z' />
      <path fill='#fff' d='M15.5 8h2v8h-2z' />
    </svg>
  )
}
