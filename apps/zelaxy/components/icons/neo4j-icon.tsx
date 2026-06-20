import type { SVGProps } from 'react'

export function Neo4jIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#018BFF' width='24' height='24' rx='4' />
      <g fill='#fff'>
        <circle cx='7' cy='8' r='2' />
        <circle cx='16.5' cy='6.5' r='2' />
        <circle cx='17' cy='15' r='2' />
        <circle cx='8' cy='17' r='2' />
        <path
          stroke='#fff'
          strokeWidth='1'
          d='M7 8 16.5 6.5 M7 8 8 17 M16.5 6.5 17 15 M8 17 17 15'
        />
      </g>
    </svg>
  )
}
