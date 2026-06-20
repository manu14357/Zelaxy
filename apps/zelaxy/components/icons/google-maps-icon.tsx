import type { SVGProps } from 'react'

export function GoogleMapsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#34A853' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z'
      />
    </svg>
  )
}
