import type { SVGProps } from 'react'

export function InstantlyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#4338CA' width='24' height='24' rx='4' />
      <path fill='#fff' d='M13 4 6 13h4l-1 7 7-9h-4z' />
    </svg>
  )
}
