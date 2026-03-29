import type { SVGProps } from 'react'

export function WorkflowIcon(props: SVGProps<SVGSVGElement>) {
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
        d='M3 12L8 7V10H16V14H8V17L3 12Z'
        stroke='currentColor'
        strokeWidth='2'
        fill='none'
        strokeLinejoin='round'
      />
      <circle cx='20' cy='6' r='3' stroke='currentColor' strokeWidth='2' fill='none' />
      <circle cx='20' cy='18' r='3' stroke='currentColor' strokeWidth='2' fill='none' />
      <path d='M17 6L16 10' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path d='M17 18L16 14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
  )
}
