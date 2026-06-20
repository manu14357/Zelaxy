import type { SVGProps } from 'react'

export function ProspeoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF5C35' width='24' height='24' rx='4' />
      <path fill='#fff' d='M7 6h5a4 4 0 0 1 0 8H9v4H7V6zm2 2v4h3a2 2 0 0 0 0-4H9z' />
    </svg>
  )
}
