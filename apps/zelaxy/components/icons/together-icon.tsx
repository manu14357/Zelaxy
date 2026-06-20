import type { SVGProps } from 'react'

export function TogetherIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0F1117' width='24' height='24' rx='4' />
      <g fill='#6E56CF'>
        <circle cx='8' cy='8' r='2.4' />
        <circle cx='16' cy='8' r='2.4' />
        <circle cx='8' cy='16' r='2.4' />
      </g>
      <circle cx='16' cy='16' r='2.4' fill='#fff' />
    </svg>
  )
}
