import type { SVGProps } from 'react'

export function MSSQLIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <path
        fill='#CC2927'
        d='M2 4v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z'
      />
      <path
        fill='#fff'
        d='M7.5 8h1.3l1.2 4.1L11.2 8h1.3l-1.9 5.7v3.3H9.4v-3.3L7.5 8zm6.1 0h1.2v7h2.7v2h-3.9V8z'
      />
    </svg>
  )
}
