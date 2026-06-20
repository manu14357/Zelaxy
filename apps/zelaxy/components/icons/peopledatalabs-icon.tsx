import type { SVGProps } from 'react'

export function PeopleDataLabsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#6C5CE7' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M9 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 7c2.76 0 5 1.57 5 3.5V18H4v-1.5C4 14.57 6.24 13 9 13zm7-7h4v2h-4V6zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z'
      />
    </svg>
  )
}
