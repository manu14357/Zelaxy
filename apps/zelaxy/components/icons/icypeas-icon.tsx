import type { SVGProps } from 'react'

export function IcypeasIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#00B8D9' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M10.8 6h2.4v3.4h2.6c2 0 3.2 1.1 3.2 2.9s-1.2 3-3.2 3h-2.6V18h-2.4V6zm2.4 5.3v2h2.2c.7 0 1.1-.4 1.1-1s-.4-1-1.1-1h-2.2zM6 6h2.4v12H6V6z'
      />
    </svg>
  )
}
