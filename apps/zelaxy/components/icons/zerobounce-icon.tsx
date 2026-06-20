import type { SVGProps } from 'react'

export function ZeroBounceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF6B35' width='24' height='24' rx='4' />
      <path fill='#fff' d='M7 7h10v2.2l-6.1 5.6H17V17H7v-2.2l6.1-5.6H7z' />
    </svg>
  )
}
