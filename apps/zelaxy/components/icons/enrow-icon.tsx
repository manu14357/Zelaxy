import type { SVGProps } from 'react'

export function EnrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#5E35B1' width='24' height='24' rx='4' />
      <path fill='#fff' d='M7 7h10v2.2h-7.6v1.7H16v2.1H9.4v1.8H17V17H7V7z' />
    </svg>
  )
}
