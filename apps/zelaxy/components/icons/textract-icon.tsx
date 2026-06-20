import type { SVGProps } from 'react'

export function TextractIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF9900' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M7 4h7l3 3v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm6 1.5V8h2.5L13 5.5zM8.5 11h7v1.3h-7V11zm0 2.6h7v1.3h-7v-1.3zm0 2.6h4.5v1.3H8.5v-1.3z'
      />
    </svg>
  )
}
