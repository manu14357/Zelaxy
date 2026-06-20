import type { SVGProps } from 'react'

export function SimilarwebIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0061FF' width='24' height='24' rx='4' />
      <g fill='#fff'>
        <rect x='6' y='12' width='2.6' height='6' rx='0.6' />
        <rect x='10.7' y='9' width='2.6' height='9' rx='0.6' />
        <rect x='15.4' y='6' width='2.6' height='12' rx='0.6' />
      </g>
    </svg>
  )
}
