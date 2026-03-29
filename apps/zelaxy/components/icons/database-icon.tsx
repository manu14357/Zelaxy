import type { SVGProps } from 'react'

export function DatabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <ellipse cx='12' cy='5' rx='9' ry='3' stroke='currentColor' strokeWidth='2.5' />
      <path
        d='M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
      />
      <path
        d='M3 12c0 1.66 4 3 9 3s9-1.34 9-3'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
      />
      <circle cx='8' cy='5' r='0.5' fill='currentColor' />
      <circle cx='16' cy='5' r='0.5' fill='currentColor' />
    </svg>
  )
}
