import type { SVGProps } from 'react'

export function ExaAIIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#000' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M5 7h6v2H7v2h3.5v2H7v2h4v2H5V7zm8.5 0H16l1.5 4L19 7h2.5l-3 5 3 5H19l-1.5-4-1.5 4h-2.5l3-5-3-5z'
      />
    </svg>
  )
}
