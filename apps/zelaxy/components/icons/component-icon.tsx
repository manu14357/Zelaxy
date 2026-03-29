import type { SVGProps } from 'react'

export function ComponentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='30'
      height='30'
      viewBox='0 0 30 30'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M10.45 6.55L15 2L19.55 6.55L15 11.1L10.45 6.55ZM18.9 15.65L23.45 11.1L28 15.65L23.45 20.2L18.9 15.65ZM10.45 23.45L15 18.9L19.55 23.45L15 28L10.45 23.45ZM2 15L6.55 10.45L11.1 15L6.55 19.55L2 15Z'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
