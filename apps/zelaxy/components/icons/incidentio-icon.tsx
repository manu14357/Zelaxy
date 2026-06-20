import type { SVGProps } from 'react'

export function IncidentioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#F25533' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5l7 4v6l-7 4-7-4V9l7-4zm0 2.3L7 10v4l5 2.7 5-2.7v-4L12 7.3zM11 9h2v4h-2V9zm0 5h2v2h-2v-2z'
      />
    </svg>
  )
}
