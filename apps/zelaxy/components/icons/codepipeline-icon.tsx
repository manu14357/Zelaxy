import type { SVGProps } from 'react'

export function CodepipelineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#4D27A8' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M7 6h6a3 3 0 013 3v1h2l-3 3-3-3h2V9a1 1 0 00-1-1H7V6zm10 12h-6a3 3 0 01-3-3v-1H6l3-3 3 3H10v1a1 1 0 001 1h6v2z'
      />
    </svg>
  )
}
