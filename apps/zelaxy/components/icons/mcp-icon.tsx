import type { SVGProps } from 'react'

export function McpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <circle fill='#6366F1' cx='12' cy='12' r='10' />
      <path fill='#fff' d='M8 8v8h1.5v-3h2v3H13V8h-1.5v3.5h-2V8H8zm7 0v8h1.5V8H15z' />
    </svg>
  )
}
