import type { SVGProps } from 'react'

export function OktaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#007DC1' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z'
      />
    </svg>
  )
}
