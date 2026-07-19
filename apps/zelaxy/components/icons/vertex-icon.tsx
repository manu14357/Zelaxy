import type { SVGProps } from 'react'

export function VertexIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#fff' width='24' height='24' rx='4' />
      <path d='M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z' fill='none' stroke='#4285F4' strokeWidth='1.6' />
      <circle cx='12' cy='12' r='2.4' fill='#4285F4' />
      <circle cx='12' cy='4.6' r='1.3' fill='#EA4335' />
      <circle cx='19' cy='16' r='1.3' fill='#FBBC04' />
      <circle cx='5' cy='16' r='1.3' fill='#34A853' />
    </svg>
  )
}
