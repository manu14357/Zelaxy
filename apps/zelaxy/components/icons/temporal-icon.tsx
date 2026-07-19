import type { SVGProps } from 'react'

export function TemporalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect width='24' height='24' rx='4' fill='#141414' />
      <circle cx='12' cy='12' r='7.5' fill='none' stroke='#7C4DFF' strokeWidth='1.6' />
      <circle cx='12' cy='12' r='1.9' fill='#7C4DFF' />
      <path d='M12 12 L12 6.4' stroke='#7C4DFF' strokeWidth='1.6' strokeLinecap='round' />
      <path d='M12 12 L15.9 14.3' stroke='#B39DFF' strokeWidth='1.6' strokeLinecap='round' />
    </svg>
  )
}
