import type { SVGProps } from 'react'

export function SMTPIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <rect
        x='2'
        y='4'
        width='20'
        height='16'
        rx='2'
        fill='#4A90D9'
        stroke='white'
        strokeWidth='1'
      />
      <polyline points='2,4 12,13 22,4' fill='none' stroke='white' strokeWidth='1.5' />
      <line x1='2' y1='20' x2='8.5' y2='12' stroke='white' strokeWidth='1' />
      <line x1='22' y1='20' x2='15.5' y2='12' stroke='white' strokeWidth='1' />
    </svg>
  )
}
