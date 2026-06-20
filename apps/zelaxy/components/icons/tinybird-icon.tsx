import type { SVGProps } from 'react'

export function TinybirdIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#27F795' width='24' height='24' rx='4' />
      <g fill='#0A0A0A'>
        <path d='m12 4 2.2 4.4L18.6 6l-2.4 4.4L20 12l-3.8 1.6L18.6 18l-4.4-2.4L12 20l-2.2-4.4L5.4 18l2.4-4.4L4 12l3.8-1.6L5.4 6l4.4 2.4L12 4z' />
      </g>
    </svg>
  )
}
