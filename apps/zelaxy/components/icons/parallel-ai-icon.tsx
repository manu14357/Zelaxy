import type { SVGProps } from 'react'

export function ParallelAiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1D1C1A' width='24' height='24' rx='4' />
      <g fill='#fff'>
        <rect x='6' y='5' width='2.6' height='14' rx='1.3' />
        <rect x='10.7' y='5' width='2.6' height='14' rx='1.3' />
        <rect x='15.4' y='5' width='2.6' height='14' rx='1.3' />
      </g>
    </svg>
  )
}
