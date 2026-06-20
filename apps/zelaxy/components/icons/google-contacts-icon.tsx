import type { SVGProps } from 'react'

export function GoogleContactsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1A73E8' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 1.5c-2.7 0-6 1.35-6 3.6V18.5h12v-1.4c0-2.25-3.3-3.6-6-3.6z'
      />
    </svg>
  )
}
