import type { SVGProps } from 'react'

export function VantaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#6749F0' width='24' height='24' rx='4' />
      <path fill='#fff' d='M6 6h2.6l3.4 8.4L15.4 6H18l-5 12h-2L6 6z' />
    </svg>
  )
}
