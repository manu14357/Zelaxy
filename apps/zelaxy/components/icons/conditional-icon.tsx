import type { SVGProps } from 'react'

export function ConditionalIcon(props: SVGProps<SVGSVGElement>) {
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
        d='M12 2L18 7H15V11H21V14H15V18H18L12 22L6 18H9V14H3V11H9V7H6L12 2Z'
        stroke='currentColor'
        strokeWidth='2'
        fill='none'
        strokeLinejoin='round'
      />
      <circle cx='12' cy='12' r='2' fill='currentColor' />
    </svg>
  )
}
