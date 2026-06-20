import type { SVGProps } from 'react'

export function MiMoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect width='24' height='24' rx='5' fill='#FF6900' />
      <text
        x='12'
        y='16.5'
        textAnchor='middle'
        fontFamily='Arial, sans-serif'
        fontSize='10'
        fontWeight='700'
        fill='#FFFFFF'
      >
        Mi
      </text>
    </svg>
  )
}
