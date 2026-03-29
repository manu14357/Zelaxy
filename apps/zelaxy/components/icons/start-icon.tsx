import type { SVGProps } from 'react'

export function StartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M7 15L12 8L17 15'
        stroke='currentColor'
        strokeWidth='3'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
    </svg>
  )
}
