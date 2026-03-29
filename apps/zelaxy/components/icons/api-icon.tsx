import type { SVGProps } from 'react'

export function ApiIcon(props: SVGProps<SVGSVGElement>) {
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
        x='4'
        y='4'
        width='16'
        height='16'
        rx='4'
        stroke='currentColor'
        strokeWidth='2'
        fill='none'
      />
      <path d='M8 12H16' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path d='M12 8V16' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <circle cx='8' cy='8' r='1' fill='currentColor' />
      <circle cx='16' cy='8' r='1' fill='currentColor' />
      <circle cx='8' cy='16' r='1' fill='currentColor' />
      <circle cx='16' cy='16' r='1' fill='currentColor' />
    </svg>
  )
}
