import type { SVGProps } from 'react'

export function SqsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF4F8B' width='24' height='24' rx='4' />
      <path fill='#fff' d='M6 7h9l3 5-3 5H6l3-5-3-5zm3.5 2l-1.8 3 1.8 3H14l1.8-3-1.8-3H9.5z' />
    </svg>
  )
}
