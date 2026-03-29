import type { SVGProps } from 'react'

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='9' cy='6' r='3' />
      <circle cx='16' cy='6' r='3' />
      <path d='M12 12c-2.5 0-8 1.25-8 4v3h16v-3c0-2.75-5.5-4-8-4z' />
      <path d='M20 12c1.5 0 4 0.75 4 2.5v2.5h-3' />
    </svg>
  )
}
