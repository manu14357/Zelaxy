import type { SVGProps } from 'react'

export function OpenRouterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0B0B0B' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M5 9.5h4.2c1 0 1.6.4 2.4 1l1.1.9c.6.5 1 .6 1.8.6H17V9l4 3-4 3v-2.1h-2.5c-1 0-1.6-.3-2.4-1l-1.1-.9c-.6-.5-1-.6-1.8-.6H5v-2z'
      />
    </svg>
  )
}
