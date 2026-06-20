import type { SVGProps } from 'react'

export function RipplingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FFC107' width='24' height='24' rx='4' />
      <path
        fill='#1A1A2E'
        d='M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 2.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z'
      />
    </svg>
  )
}
