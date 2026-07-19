import type { SVGProps } from 'react'

export function ZepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect width='24' height='24' rx='5' fill='#0E9F6E' />
      <path
        d='M6.5 6.75h11L8.75 15.5h8.75'
        fill='none'
        stroke='#fff'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
