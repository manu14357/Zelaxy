import type { SVGProps } from 'react'

export function SesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF9900' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M5 7h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm.6 1.5L12 13l6.4-4.5H5.6zM6 10.2V15h12v-4.8l-6 4.2-6-4.2z'
      />
    </svg>
  )
}
