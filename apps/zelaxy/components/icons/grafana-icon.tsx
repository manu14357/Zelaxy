import type { SVGProps } from 'react'

export function GrafanaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#F46800' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 2.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
      />
    </svg>
  )
}
