import type { SVGProps } from 'react'

export function ReductoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#6D28D9' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M6 6h5.4c2.2 0 3.6 1.2 3.6 3 0 1.4-.8 2.4-2.2 2.8l2.6 4.2h-2.5l-2.3-3.9H8.1V16H6V6zm2.1 1.8v2.6h3c1.1 0 1.8-.5 1.8-1.3s-.7-1.3-1.8-1.3h-3zM16 6h2v10h-2V6z'
      />
    </svg>
  )
}
