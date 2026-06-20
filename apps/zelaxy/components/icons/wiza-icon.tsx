import type { SVGProps } from 'react'

export function WizaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#5B21B6' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M4 7h2.2l1.8 6.4L9.9 7h2.2l1.9 6.4L15.8 7H18l-2.9 10h-2.2l-1.9-6.3L9.1 17H6.9L4 7z'
      />
    </svg>
  )
}
