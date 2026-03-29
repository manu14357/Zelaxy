import type { SVGProps } from 'react'

export function TavilyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' {...props}>
      <circle cx='12' cy='12' r='10' fill='#4A90E2' />
      <path d='M8 12h8M12 8v8' stroke='white' strokeWidth='2' strokeLinecap='round' />
      <path d='M16 8l-8 8M8 8l8 8' stroke='white' strokeWidth='1' strokeLinecap='round' />
    </svg>
  )
}
