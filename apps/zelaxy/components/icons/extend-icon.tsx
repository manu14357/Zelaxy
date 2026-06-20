import type { SVGProps } from 'react'

export function ExtendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#111827' width='24' height='24' rx='4' />
      <path fill='#fff' d='M6 6h12v2H8v3h8v2H8v3h10v2H6V6z' />
    </svg>
  )
}
