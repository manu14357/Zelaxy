import type { SVGProps } from 'react'

export function WebhookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <circle fill='currentColor' cx='7' cy='8' r='3' />
      <circle fill='currentColor' cx='17' cy='8' r='3' />
      <circle fill='currentColor' cx='12' cy='18' r='3' />
      <path fill='none' stroke='currentColor' strokeWidth='2' d='M7 11v4l5 3' />
      <path fill='none' stroke='currentColor' strokeWidth='2' d='M17 11v4l-5 3' />
      <path fill='none' stroke='currentColor' strokeWidth='2' d='M9 18h6' />
    </svg>
  )
}
