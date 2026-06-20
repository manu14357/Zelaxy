import type { SVGProps } from 'react'

export function MicrosoftAdIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0078D4' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4l6 3v4.5c0 3.5-2.4 6.7-6 7.5-3.6-.8-6-4-6-7.5V7l6-3zm0 2.18L8 7.62v3.88c0 2.5 1.66 4.78 4 5.46 2.34-.68 4-2.96 4-5.46V7.62l-4-1.44z'
      />
    </svg>
  )
}
