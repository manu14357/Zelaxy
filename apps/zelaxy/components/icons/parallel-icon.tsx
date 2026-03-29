import type { SVGProps } from 'react'

export function ParallelIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d='M3 12h6' />
      <path d='M15 12h6' />
      <path d='M12 3v6' />
      <path d='M12 15v6' />
      <circle cx='12' cy='12' r='2' />
      <path d='M8 8l8 8' />
      <path d='M16 8l-8 8' />
    </svg>
  )
}
