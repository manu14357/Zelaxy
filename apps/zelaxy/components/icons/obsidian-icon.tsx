import type { SVGProps } from 'react'

export function ObsidianIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#7C3AED' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M13 4 7 8.5 5.5 15l3.5 5 5.5-1.5 3-5.5-2-6.5L13 4zm-.4 2.3 3 1.8 1.5 5-2.2 4-3.7 1L8.6 16l1.1-5.2 2.9-4.5z'
      />
    </svg>
  )
}
