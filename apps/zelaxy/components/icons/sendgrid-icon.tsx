import type { SVGProps } from 'react'

export function SendgridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1A82E2' width='24' height='24' rx='4' />
      <path fill='#fff' d='M5 5h7v7H5z' />
      <path fill='#fff' opacity='0.7' d='M12 12h7v7h-7z' />
      <path fill='#fff' opacity='0.85' d='M12 5h7v7h-7z' />
      <path fill='#fff' opacity='0.85' d='M5 12h7v7H5z' />
    </svg>
  )
}
