import type { SVGProps } from 'react'

export function RevenueCatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#F25A5A' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4l2.06 4.18L18.66 9l-3.33 3.25.79 4.6L12 14.7l-4.12 2.16.79-4.6L5.34 9l4.6-.82L12 4z'
      />
    </svg>
  )
}
