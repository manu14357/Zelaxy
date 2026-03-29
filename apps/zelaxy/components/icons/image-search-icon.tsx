import type { SVGProps } from 'react'

export function ImageSearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect
        x='2'
        y='2'
        width='15'
        height='15'
        rx='2'
        stroke='currentColor'
        strokeWidth='1.5'
        fill='none'
      />
      <circle cx='8' cy='7' r='1.5' stroke='currentColor' strokeWidth='1.2' fill='none' />
      <path
        d='M2 13l4-4 3 3 2-2 4 4'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
      />
      <circle cx='18' cy='18' r='4' stroke='currentColor' strokeWidth='1.5' fill='none' />
      <path d='M21 21l2 2' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
  )
}
