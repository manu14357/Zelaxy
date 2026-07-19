import type { SVGProps } from 'react'

export function SakanaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#E60000' width='24' height='24' rx='4' />
      <path d='M4 12c3-4 8-4 11-1l4-3-1.6 4L19 16l-4-3c-3 3-8 3-11-1z' fill='#fff' />
      <circle cx='7.5' cy='11' r='0.9' fill='#E60000' />
    </svg>
  )
}
