import type { SVGProps } from 'react'

export function CerebrasIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF5722' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M6 6h3v3H6zm4.5 0h3v3h-3zM15 6h3v3h-3zM6 10.5h3v3H6zm4.5 0h3v3h-3zM15 10.5h3v3h-3zM6 15h3v3H6zm4.5 0h3v3h-3zM15 15h3v3h-3z'
      />
    </svg>
  )
}
