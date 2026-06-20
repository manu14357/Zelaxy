import type { SVGProps } from 'react'

export function SttIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#10B981' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0v-5A2.5 2.5 0 0 0 12 4zm6 7.5a6 6 0 0 1-5 5.91V20h-2v-2.59a6 6 0 0 1-5-5.91h2a4 4 0 0 0 8 0h2z'
      />
    </svg>
  )
}
