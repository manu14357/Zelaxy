import type { SVGProps } from 'react'

export function StagehandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1E1E2E' width='24' height='24' rx='4' />
      <circle fill='#CBA6F7' cx='12' cy='9' r='3' />
      <path fill='#CBA6F7' d='M7 18c0-2.8 2.2-5 5-5s5 2.2 5 5v1H7v-1z' />
    </svg>
  )
}
