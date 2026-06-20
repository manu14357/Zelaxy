import type { SVGProps } from 'react'

export function MondayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF3D57' width='24' height='24' rx='4' />
      <g fill='#fff'>
        <circle cx='7' cy='15' r='1.8' />
        <rect x='10' y='13.5' width='9' height='3' rx='1.5' />
        <rect x='10' y='8.5' width='9' height='3' rx='1.5' opacity='0.7' />
        <circle cx='7' cy='10' r='1.8' opacity='0.7' />
      </g>
    </svg>
  )
}
