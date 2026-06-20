import type { SVGProps } from 'react'

export function LinqIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0EA5E9' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M10.5 7.5a3.5 3.5 0 0 1 0 5l-1.2 1.2a3.5 3.5 0 1 1-5-5l1.6-1.6 1.4 1.4-1.6 1.6a1.5 1.5 0 1 0 2.1 2.1l1.2-1.2a1.5 1.5 0 0 0 0-2.1l1.5-1.4zm3 9a3.5 3.5 0 0 1 0-5l1.2-1.2a3.5 3.5 0 1 1 5 5l-1.6 1.6-1.4-1.4 1.6-1.6a1.5 1.5 0 1 0-2.1-2.1l-1.2 1.2a1.5 1.5 0 0 0 0 2.1l-1.5 1.4z'
      />
    </svg>
  )
}
