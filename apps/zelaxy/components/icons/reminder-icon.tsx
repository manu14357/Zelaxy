import type { SVGProps } from 'react'

export function ReminderIcon(props: SVGProps<SVGSVGElement>) {
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
        d='M2 5.22256L6.55 2M28 5.22256L23.45 2M26.5556 16.4444C26.5556 19.5092 25.3381 22.4484 23.171 24.6155C21.0039 26.7825 18.0647 28 15 28C11.9353 28 8.99608 26.7825 6.82899 24.6155C4.6619 22.4484 3.44444 19.5092 3.44444 16.4444C3.44444 13.3797 4.6619 10.4405 6.82899 8.27343C8.99608 6.10635 11.9353 4.88889 15 4.88889C18.0647 4.88889 21.0039 6.10635 23.171 8.27343C25.3381 10.4405 26.5556 13.3797 26.5556 16.4444Z'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M15 9.94446V17.1667L19.3333 20.0556'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
