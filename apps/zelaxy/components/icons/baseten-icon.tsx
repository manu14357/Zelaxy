import type { SVGProps } from 'react'

export function BasetenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#000' width='24' height='24' rx='4' />
      <path fill='#fff' d='M6 5h7a4 4 0 0 1 0 8H9v6H6V5zm3 2.6V10.4h4a1.4 1.4 0 0 0 0-2.8H9z' />
    </svg>
  )
}
