import type { SVGProps } from 'react'

export function ClickhouseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FFCC01' width='24' height='24' rx='4' />
      <g fill='#1A1A1A'>
        <rect x='5' y='5' width='2.6' height='14' />
        <rect x='9' y='5' width='2.6' height='14' />
        <rect x='13' y='5' width='2.6' height='14' />
        <rect x='17' y='10.7' width='2.6' height='2.6' />
      </g>
    </svg>
  )
}
