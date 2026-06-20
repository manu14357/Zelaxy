import type { SVGProps } from 'react'

export function LatexIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#008080' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M6 7h2.2v8h3.6v1.8H6V7zm6.1 0h6v1.8h-2v8h-2.1V8.8h-1.9V7zm6.4 4.1 1.5-4.1H22l-2.3 5 2.4 5h-2l-1.6-4.1-.5 1.3v2.8h-1.9v-2.3l2.4-3.4z'
      />
    </svg>
  )
}
