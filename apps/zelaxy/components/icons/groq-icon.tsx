import type { SVGProps } from 'react'

export function GroqIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#F55036' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 2a5 5 0 0 1 5 5h-3a2 2 0 1 0-2 2v3a5 5 0 0 1 0-10z'
      />
    </svg>
  )
}
