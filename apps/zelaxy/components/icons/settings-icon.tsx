import type { SVGProps } from 'react'

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx='12' cy='12' r='3' />
      <path d='M12 1v6m0 8v6' />
      <path d='m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24' />
      <path d='M1 12h6m8 0h6' />
      <path d='m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24' />
    </svg>
  )
}
