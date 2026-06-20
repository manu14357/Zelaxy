import type { SVGProps } from 'react'

export function PostHogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#F54E00' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M6 6l6 6v-6h2v8H8L6 12V6zm0 6l4 4H6v-4zm8-6h2l4 4v6l-6-6V6zm0 6l4 4h-4v-4z'
      />
    </svg>
  )
}
