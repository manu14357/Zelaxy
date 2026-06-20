import type { SVGProps } from 'react'

export function SquareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#000000' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        fillRule='evenodd'
        d='M6.5 4A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 17.5 4h-11zm.6 3.1c0-.28.22-.5.5-.5h8.8c.28 0 .5.22.5.5v8.8a.5.5 0 0 1-.5.5H7.6a.5.5 0 0 1-.5-.5V7.1zm3 2a.5.5 0 0 0-.5.5v4.8c0 .28.22.5.5.5h4.8a.5.5 0 0 0 .5-.5V9.6a.5.5 0 0 0-.5-.5H10.1z'
      />
    </svg>
  )
}
