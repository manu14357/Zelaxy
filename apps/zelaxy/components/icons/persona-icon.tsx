import type { SVGProps } from 'react'

export function PersonaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#4F46E5' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 8c3.9 0 7 2 7 4.5V19H5v-1.5C5 15 8.1 13 12 13z'
      />
    </svg>
  )
}
