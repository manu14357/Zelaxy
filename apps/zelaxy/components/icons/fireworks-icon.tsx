import type { SVGProps } from 'react'

export function FireworksIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#5019C5' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4l1.8 4.4L18 6.6l-2 4.1 4 1.3-4 1.3 2 4.1-4.2-1.8L12 20l-1.8-4.4L6 17.4l2-4.1L4 12l4-1.3-2-4.1 4.2 1.8z'
      />
    </svg>
  )
}
