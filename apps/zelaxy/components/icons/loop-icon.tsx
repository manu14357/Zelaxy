import type { SVGProps } from 'react'

export function LoopIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d='M21 8c0-2.8-2.2-5-5-5H8c-2.8 0-5 2.2-5 5v8c0 2.8 2.2 5 5 5h8c2.8 0 5-2.2 5-5V8z' />
      <path d='M16 12l-4-4-4 4' />
      <path d='M12 16V8' />
      <circle cx='12' cy='12' r='1' />
    </svg>
  )
}
