import type { SVGProps } from 'react'

export function WebflowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#4353FF' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M19 7l-3.2 8.5h-2.1l-1.34-4.16h-.04L10.9 15.5H8.8L5.6 7h2.2l1.74 5.16h.03L11.06 7h1.96l1.43 5.16h.04L16.3 7H19z'
      />
    </svg>
  )
}
