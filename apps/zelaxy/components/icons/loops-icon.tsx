import type { SVGProps } from 'react'

export function LoopsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF7878' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M8.5 7a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 4-2.43A4.5 4.5 0 1 0 16.5 7a4.5 4.5 0 0 0-4 2.43A4.5 4.5 0 0 0 8.5 7zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm8 0a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z'
      />
    </svg>
  )
}
