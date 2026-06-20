import type { SVGProps } from 'react'

export function FirefliesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#6E3AFF' width='24' height='24' rx='4' />
      <g fill='#fff'>
        <circle cx='12' cy='12' r='3' />
        <circle cx='6' cy='7' r='1.5' opacity='0.85' />
        <circle cx='18' cy='8' r='1.5' opacity='0.85' />
        <circle cx='7' cy='17' r='1.5' opacity='0.85' />
        <circle cx='17' cy='17' r='1.5' opacity='0.85' />
      </g>
    </svg>
  )
}
