import type { SVGProps } from 'react'

export function LemlistIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#4A4AEE' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M5 7.5A1.5 1.5 0 0 1 6.5 6h11A1.5 1.5 0 0 1 19 7.5v9A1.5 1.5 0 0 1 17.5 18h-11A1.5 1.5 0 0 1 5 16.5v-9zm2 .6v8.4h10V8.1l-5 3.6-5-3.6zm1.2-.6L12 10l3.8-2.5H8.2z'
      />
    </svg>
  )
}
