import type { SVGProps } from 'react'

export function TailscaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#242424' width='24' height='24' rx='4' />
      <g fill='#fff'>
        <circle cx='7' cy='7' r='1.6' opacity='0.4' />
        <circle cx='12' cy='7' r='1.6' opacity='0.4' />
        <circle cx='17' cy='7' r='1.6' opacity='0.4' />
        <circle cx='7' cy='12' r='1.6' />
        <circle cx='12' cy='12' r='1.6' />
        <circle cx='17' cy='12' r='1.6' />
        <circle cx='7' cy='17' r='1.6' opacity='0.4' />
        <circle cx='12' cy='17' r='1.6' opacity='0.4' />
        <circle cx='17' cy='17' r='1.6' opacity='0.4' />
      </g>
    </svg>
  )
}
