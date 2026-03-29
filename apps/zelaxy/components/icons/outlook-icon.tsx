import type { SVGProps } from 'react'

export function OutlookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <path fill='#0078D4' d='M22.5 5.25H13.5v3.15l4.65 2.85 4.35-2.85V5.25z' />
      <path fill='#0364B8' d='M22.5 5.25H17.7v3.15l4.8 3v-6.15z' />
      <path fill='#28A8EA' d='M22.5 8.4l-4.8 3-4.2-3v10.35h9V8.4z' />
      <path fill='#0078D4' d='M13.5 5.25v13.5H22.5V5.25H13.5z' opacity='.5' />
      <rect fill='#0078D4' x='1.5' y='5.25' width='10.5' height='13.5' rx='1.2' />
      <path
        fill='#fff'
        d='M6.75 9c-2.07 0-3.375 1.35-3.375 3s1.305 3 3.375 3 3.375-1.35 3.375-3-1.305-3-3.375-3zm0 4.8c-1.17 0-1.875-.75-1.875-1.8s.705-1.8 1.875-1.8 1.875.75 1.875 1.8-.705 1.8-1.875 1.8z'
      />
    </svg>
  )
}
