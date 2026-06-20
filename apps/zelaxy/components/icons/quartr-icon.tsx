import type { SVGProps } from 'react'

export function QuartrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#5B21B6' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5a7 7 0 1 0 4.2 12.6l1.8 1.8 1.4-1.4-1.8-1.8A7 7 0 0 0 12 5zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z'
      />
    </svg>
  )
}
