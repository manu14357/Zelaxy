import type { SVGProps } from 'react'

export function LinkupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <circle fill='#4F46E5' cx='12' cy='12' r='10' />
      <path
        fill='#fff'
        d='M10.5 7.5a3 3 0 0 1 3 3v1h-1.5v-1a1.5 1.5 0 0 0-3 0v3a1.5 1.5 0 0 0 3 0v-1h1.5v1a3 3 0 0 1-6 0v-3a3 3 0 0 1 3-3zm3 3v3a1.5 1.5 0 0 0 3 0v-3a1.5 1.5 0 0 0-3 0z'
        strokeWidth='0'
      />
    </svg>
  )
}
