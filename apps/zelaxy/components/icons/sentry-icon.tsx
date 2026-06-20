import type { SVGProps } from 'react'

export function SentryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#362D59' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12.76 6.6a.88.88 0 0 0-1.52 0l-2 3.46a6.96 6.96 0 0 1 3.66 5.72h-1.46a5.5 5.5 0 0 0-2.93-4.46l-1.5 2.6a2.5 2.5 0 0 1 1.45 2.28H5.05a.36.36 0 0 1-.31-.54l1.2-2.08a2.7 2.7 0 0 0-.84-.49l-1.2 2.07a1.4 1.4 0 0 0 1.2 2.1h4.45a3.5 3.5 0 0 0-1.74-3.5l.5-.86a4.5 4.5 0 0 1 2.25 3.9v.46h3.45v-.46a7.96 7.96 0 0 0-3.92-6.86l1.16-2.01a.13.13 0 0 1 .23 0l5.5 9.52a.36.36 0 0 1-.31.54h-1.04c.01.29.01.58 0 .87h1.04a1.4 1.4 0 0 0 1.2-2.1z'
      />
    </svg>
  )
}
