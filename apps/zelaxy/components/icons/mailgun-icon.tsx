import type { SVGProps } from 'react'

export function MailgunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#C02126' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm4.5 9.5a2 2 0 1 1 0 .01z'
      />
      <circle fill='#fff' cx='12' cy='12' r='2' />
    </svg>
  )
}
