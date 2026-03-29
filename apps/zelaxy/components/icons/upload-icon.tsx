import type { SVGProps } from 'react'

export function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <polyline
        points='7,10 12,5 17,10'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <line
        x1='12'
        y1='5'
        x2='12'
        y2='15'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
      />
      <circle cx='12' cy='3' r='1' fill='currentColor' />
    </svg>
  )
}
