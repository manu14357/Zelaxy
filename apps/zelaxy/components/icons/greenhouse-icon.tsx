import type { SVGProps } from 'react'

export function GreenhouseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#24A47C' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4 6 7.5v9L12 20l6-3.5v-9L12 4zm0 2.3 4 2.34v4.72L12 17.7l-4-2.34V8.64L12 6.3zm0 2.2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'
      />
    </svg>
  )
}
