import type { SVGProps } from 'react'

export function VLLMIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1A1A2E' width='24' height='24' rx='4' />
      <path fill='#FDB515' d='M4 5h3.2l3 9 3-9H16l-4.6 13H8.6z' />
      <rect fill='#30A2FF' x='17' y='5' width='2.6' height='13' rx='1' />
    </svg>
  )
}
