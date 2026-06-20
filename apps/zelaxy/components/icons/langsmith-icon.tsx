import type { SVGProps } from 'react'

export function LangSmithIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1C3C3C' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 2.2 4.2 2.4v4.8L12 16.8 7.8 14.4V9.6L12 7.2zm0 2.1L9.9 10.5v3l2.1 1.2 2.1-1.2v-3L12 9.3z'
      />
    </svg>
  )
}
