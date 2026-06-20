import type { SVGProps } from 'react'

export function BrexIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#161616' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M6 6h5.2a3.1 3.1 0 0 1 2.3 5.2 3.2 3.2 0 0 1-2.3 5.4H6V6zm2.3 2.1v2.2h2.6a1.1 1.1 0 0 0 0-2.2H8.3zm0 4.2v2.4h2.8a1.2 1.2 0 0 0 0-2.4H8.3z'
      />
    </svg>
  )
}
