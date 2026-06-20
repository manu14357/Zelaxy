import type { SVGProps } from 'react'

export function WorkdayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#F58220' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M5 9h2.1l1.4 4.6L10 9h1.8l1.5 4.6L14.7 9H17l-2.4 6.8h-2L11 11.4l-1.6 4.4h-2L5 9z'
      />
    </svg>
  )
}
