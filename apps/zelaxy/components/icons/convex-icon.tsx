import type { SVGProps } from 'react'

export function ConvexIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#F3B01C' width='24' height='24' rx='4' />
      <g fill='#fff'>
        <path d='M12 5a7 7 0 1 0 6.06 10.5 5 5 0 0 1-6.49-6.84A5 5 0 0 1 17 8.2 7 7 0 0 0 12 5z' />
        <path d='M9.2 14.6a3 3 0 0 0 4.3 1 .5.5 0 0 1 .55.83 4 4 0 0 1-5.78-1.4.5.5 0 0 1 .9-.43h.03z' />
      </g>
    </svg>
  )
}
