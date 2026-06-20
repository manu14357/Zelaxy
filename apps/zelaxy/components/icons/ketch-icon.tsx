import type { SVGProps } from 'react'

export function KetchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1A1A2E' width='24' height='24' rx='4' />
      <path fill='#fff' d='M8 6h2.4v4.4L14.6 6H17.6l-4.2 4.4L18 18h-2.8l-3.2-5.2-1.6 1.7V18H8V6z' />
    </svg>
  )
}
