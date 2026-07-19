import type { SVGProps } from 'react'

export function SshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width='24'
      height='24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <rect x='2' y='4' width='20' height='16' rx='2' />
      <path d='M6 9l3 3-3 3' />
      <path d='M13 15h5' />
    </svg>
  )
}
