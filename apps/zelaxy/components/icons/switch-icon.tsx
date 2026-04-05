import type { SVGProps } from 'react'

export function SwitchCaseIcon(props: SVGProps<SVGSVGElement>) {
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
      {/* Input line */}
      <path d='M3 12h4' />
      {/* Branch node */}
      <circle cx='9' cy='12' r='2' />
      {/* Top branch */}
      <path d='M11 12l4-6h6' />
      {/* Middle branch */}
      <path d='M11 12h10' />
      {/* Bottom branch */}
      <path d='M11 12l4 6h6' />
    </svg>
  )
}
