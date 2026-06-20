import type { SVGProps } from 'react'

export function RssIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#F26522' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M6.5 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM5 10.5a8.5 8.5 0 0 1 8.5 8.5h-2.5A6 6 0 0 0 5 13v-2.5zM5 6a13 13 0 0 1 13 13h-2.5A10.5 10.5 0 0 0 5 8.5V6z'
      />
    </svg>
  )
}
