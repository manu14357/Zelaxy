import type { SVGProps } from 'react'

export function LaunchDarklyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#405BFF' width='24' height='24' rx='4' />
      <path fill='#fff' d='M6 5l11 7-11 7 3.4-7L6 5zm3 4.6L10.7 12 9 14.4 10 12 9 9.6z' />
    </svg>
  )
}
