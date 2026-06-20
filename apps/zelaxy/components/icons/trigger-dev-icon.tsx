import type { SVGProps } from 'react'

export function TriggerDevIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#4F46E5' width='24' height='24' rx='4' />
      <path fill='#fff' d='M9 6l9 6-9 6V6z' />
    </svg>
  )
}
