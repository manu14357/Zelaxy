import type { SVGProps } from 'react'

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M20 13c0 5-3.5 7.5-8 9c-4.5-1.5-8-4-8-9V6l8-3l8 3v7Z' />
      <path d='m9 12l2 2l4-4' />
    </svg>
  )
}
