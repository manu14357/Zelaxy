import type { SVGProps } from 'react'

export function StsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#DD344C' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4l6 2.5v4c0 3.6-2.4 6.9-6 8-3.6-1.1-6-4.4-6-8v-4L12 4zm0 2.2L8 7.8v2.7c0 2.5 1.6 4.8 4 5.7 2.4-.9 4-3.2 4-5.7V7.8l-4-1.6zm-.9 7.1l-1.8-1.8 1.1-1.1.7.7 2.5-2.5 1.1 1.1-3.6 3.6z'
      />
    </svg>
  )
}
