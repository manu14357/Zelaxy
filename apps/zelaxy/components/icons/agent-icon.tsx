import type { SVGProps } from 'react'

export function AgentIcon(props: SVGProps<SVGSVGElement>) {
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
        d='M12 2L14.5 6H19L15.5 9.5L17 14L12 11L7 14L8.5 9.5L5 6H9.5L12 2Z'
        stroke='currentColor'
        strokeWidth='2'
        fill='none'
      />
      <circle cx='12' cy='18' r='3' stroke='currentColor' strokeWidth='2' fill='none' />
      <path d='M12 15V12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path d='M10 19H14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
  )
}
