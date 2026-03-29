import type { SVGProps } from 'react'

export function CodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <polyline
        points='16,18 22,12 16,6'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <polyline
        points='8,6 2,12 8,18'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <line
        x1='12'
        y1='4'
        x2='12'
        y2='20'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <circle cx='12' cy='2' r='1' fill='currentColor' />
      <circle cx='12' cy='22' r='1' fill='currentColor' />
    </svg>
  )
}
