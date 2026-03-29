import type { SVGProps } from 'react'

export function WorkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect x='2' y='3' width='20' height='14' rx='2' stroke='currentColor' strokeWidth='2.5' />
      <path d='M8 21h8' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
      <path d='M12 17v4' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
      <path d='M7 8h10' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
      <path d='M7 12h7' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
    </svg>
  )
}
