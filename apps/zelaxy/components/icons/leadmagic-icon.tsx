import type { SVGProps } from 'react'

export function LeadMagicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#6E56CF' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M9 4a5 5 0 0 0-5 5c0 1.93 1.1 3.6 2.7 4.43V16h4.6v-2.57A5 5 0 0 0 9 4zm-1.7 13h3.4v1.5H7.3V17zm.4 2.5h2.6v.5a1.3 1.3 0 0 1-2.6 0v-.5z'
      />
    </svg>
  )
}
