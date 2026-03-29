import type { SVGProps } from 'react'

export function TranslateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      {...props}
    >
      <rect x='2' y='3' width='20' height='18' rx='2' fill='#4285F4' />
      <path d='m5 8 6 6' stroke='white' strokeWidth='2' />
      <path d='m4 14 6-6 2-3' stroke='white' strokeWidth='2' />
      <path d='M2 7h12' stroke='white' strokeWidth='2' />
      <path d='m22 22-5-10-5 10' fill='white' />
      <path d='M14 18h6' stroke='white' strokeWidth='2' />
    </svg>
  )
}
