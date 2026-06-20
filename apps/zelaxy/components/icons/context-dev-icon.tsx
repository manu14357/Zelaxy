import type { SVGProps } from 'react'

export function ContextDevIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#6366F1' width='24' height='24' rx='4' />
      <path
        fill='none'
        stroke='#fff'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9.5 8.5 6 12l3.5 3.5M14.5 8.5 18 12l-3.5 3.5'
      />
    </svg>
  )
}
