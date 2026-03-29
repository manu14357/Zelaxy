import type { SVGProps } from 'react'

export function MicrosoftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 23 23' width='24' height='24' {...props}>
      <rect fill='#f25022' x='1' y='1' width='10' height='10' />
      <rect fill='#7fba00' x='12' y='1' width='10' height='10' />
      <rect fill='#00a4ef' x='1' y='12' width='10' height='10' />
      <rect fill='#ffb900' x='12' y='12' width='10' height='10' />
    </svg>
  )
}
