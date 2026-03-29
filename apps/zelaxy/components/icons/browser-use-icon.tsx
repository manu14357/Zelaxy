import type { SVGProps } from 'react'

export function BrowserUseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1a1a2e' width='24' height='24' rx='4' />
      <rect fill='#e94560' x='3.5' y='5' width='17' height='14' rx='2' />
      <rect fill='#0f3460' x='3.5' y='5' width='17' height='3.5' rx='2' />
      <circle fill='#e94560' cx='6' cy='6.75' r='.75' />
      <circle fill='#f7d046' cx='8' cy='6.75' r='.75' />
      <circle fill='#16c79a' cx='10' cy='6.75' r='.75' />
      <rect fill='#fff' x='5' y='10.5' width='14' height='7' rx='1' opacity='.9' />
    </svg>
  )
}
