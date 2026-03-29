import type { SVGProps } from 'react'

export function ClayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1A1A2E' width='24' height='24' rx='6' />
      <path fill='#E94560' d='M7 8h2v8H7z' />
      <path fill='#0F3460' d='M11 8h2v8h-2z' />
      <path fill='#16213E' d='M15 8h2v8h-2z' />
    </svg>
  )
}
