import type { SVGProps } from 'react'

export function LiteLLMIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0B1021' width='24' height='24' rx='4' />
      <path fill='#22D3A6' d='M12 4l2 4 4 .6-3 2.8.8 4.4L12 17.6 8.4 19.8l.8-4.4-3-2.8 4-.6z' />
    </svg>
  )
}
