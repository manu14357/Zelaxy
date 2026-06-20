import type { SVGProps } from 'react'

export function IamIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#DD344C' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4l5 2v4.5c0 3.4-2.1 6.5-5 7.5-2.9-1-5-4.1-5-7.5V6l5-2zm0 4.5a2 2 0 100 4 2 2 0 000-4zm0 5.2c-1.8 0-3.3.9-3.8 2.2.9 1 2.3 1.7 3.8 2.2 1.5-.5 2.9-1.2 3.8-2.2-.5-1.3-2-2.2-3.8-2.2z'
      />
    </svg>
  )
}
