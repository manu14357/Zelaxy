import type { SVGProps } from 'react'

export function UpstashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#00E9A3' width='24' height='24' rx='4' />
      <g fill='#fff'>
        <path d='M7 17a7.07 7.07 0 0 0 0-10l-1.4 1.4a5.07 5.07 0 0 1 0 7.2L7 17z' />
        <path d='M10 14a2.83 2.83 0 0 0 0-4l-1.4 1.4a.83.83 0 0 1 0 1.2L10 14z' />
        <path d='M17 7a7.07 7.07 0 0 0 0 10l1.4-1.4a5.07 5.07 0 0 1 0-7.2L17 7z' />
        <path d='M14 10a2.83 2.83 0 0 0 0 4l1.4-1.4a.83.83 0 0 1 0-1.2L14 10z' />
      </g>
    </svg>
  )
}
