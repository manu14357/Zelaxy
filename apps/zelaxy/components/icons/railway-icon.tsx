import type { SVGProps } from 'react'

export function RailwayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0B0D0E' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M4 13h11.5a2 2 0 1 0 0-1H4v1zm0 3h8.5a2 2 0 1 0 0-1H4v1zm2.5-6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z'
      />
    </svg>
  )
}
