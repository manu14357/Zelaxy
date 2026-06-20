import type { SVGProps } from 'react'

export function ZoomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#2D8CFF' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M5 9.2c0-.66.54-1.2 1.2-1.2h6.1c.66 0 1.2.54 1.2 1.2v5.6c0 .66-.54 1.2-1.2 1.2H6.2c-.66 0-1.2-.54-1.2-1.2V9.2zm10 .9 3.2-2.1c.4-.27.8.02.8.5v7c0 .48-.4.77-.8.5L15 13.9v-3.8z'
      />
    </svg>
  )
}
