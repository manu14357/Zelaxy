import type { SVGProps } from 'react'

export function WebhookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width='24'
      height='24'
      fill='none'
      {...props}
    >
      <path
        d='M6.25 8.75C7.6 6.72 9.66 5.5 12 5.5C14.34 5.5 16.4 6.72 17.75 8.75'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M8.8 11.2C9.55 10.17 10.72 9.55 12 9.55C13.28 9.55 14.45 10.17 15.2 11.2'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='12' cy='13' r='2.2' fill='currentColor' />
      <path d='M12 16.8V19.1' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path
        d='M9.4 18.9L12 21.5L14.6 18.9'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
