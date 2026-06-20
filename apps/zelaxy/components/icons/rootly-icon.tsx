import type { SVGProps } from 'react'

export function RootlyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#E5484D' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M7 5h5.5c2.4 0 3.9 1.3 3.9 3.5 0 1.6-.8 2.7-2.2 3.2L17 19h-2.3l-2.5-4.7H9V19H7V5zm2 1.9v5.5h3.3c1.3 0 2.1-.6 2.1-1.8S13.6 6.9 12.3 6.9H9z'
      />
    </svg>
  )
}
