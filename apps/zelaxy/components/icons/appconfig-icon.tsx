import type { SVGProps } from 'react'

export function AppConfigIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF9900' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 6a2 2 0 0 1 2 2v1.2l1-.6 1.7 3-1 .6a2 2 0 0 1 0 1.6l1 .6-1.7 3-1-.6V18a2 2 0 0 1-4 0v-1.2l-1 .6-1.7-3 1-.6a2 2 0 0 1 0-1.6l-1-.6 1.7-3 1 .6V8a2 2 0 0 1 2-2zm0 4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'
      />
    </svg>
  )
}
