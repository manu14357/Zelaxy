import type { SVGProps } from 'react'

export function DatagmaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1F6FEB' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5c-3.31 0-6 1.34-6 3v8c0 1.66 2.69 3 6 3s6-1.34 6-3V8c0-1.66-2.69-3-6-3zm0 2c2.21 0 4 .67 4 1.5S14.21 10 12 10 8 9.33 8 8.5 9.79 7 12 7zm4 9c0 .83-1.79 1.5-4 1.5s-4-.67-4-1.5v-1.6c1.06.57 2.5.9 4 .9s2.94-.33 4-.9V16zm0-3.5c0 .83-1.79 1.5-4 1.5s-4-.67-4-1.5v-1.6c1.06.57 2.5.9 4 .9s2.94-.33 4-.9v1.6z'
      />
    </svg>
  )
}
