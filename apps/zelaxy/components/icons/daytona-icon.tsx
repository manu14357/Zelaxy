import type { SVGProps } from 'react'

export function DaytonaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1F6FEB' width='24' height='24' rx='4' />
      <path fill='#fff' d='M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z' />
    </svg>
  )
}
