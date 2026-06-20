import type { SVGProps } from 'react'

export function ZoomInfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#E22E20' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M11 5a5 5 0 1 0 3.2 8.84l2.98 2.99 1.41-1.42-2.98-2.98A5 5 0 0 0 11 5zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z'
      />
    </svg>
  )
}
