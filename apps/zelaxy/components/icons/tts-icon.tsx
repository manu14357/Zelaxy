import type { SVGProps } from 'react'

export function TtsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#8B5CF6' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M11 5L6.5 8.5H4v7h2.5L11 19V5zm4.5 2.6a5 5 0 0 1 0 8.8l-1-1.7a3 3 0 0 0 0-5.4l1-1.7zm2.2-2.2a8 8 0 0 1 0 13.2l-1-1.7a6 6 0 0 0 0-9.8l1-1.7z'
      />
    </svg>
  )
}
