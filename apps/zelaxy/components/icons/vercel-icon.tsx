import type { SVGProps } from 'react'

export function VercelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#000000' width='24' height='24' rx='4' />
      <path fill='#fff' d='M12 5l6 11H6L12 5z' />
    </svg>
  )
}
