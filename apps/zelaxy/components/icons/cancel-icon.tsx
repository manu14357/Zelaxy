import type { SVGProps } from 'react'

export function CancelIcon(props: SVGProps<SVGSVGElement>) {
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
        d='M28 15C28 16.7072 27.6637 18.3977 27.0104 19.9749C26.3571 21.5521 25.3995 22.9852 24.1924 24.1924C22.9852 25.3995 21.5521 26.3571 19.9749 27.0104C18.3977 27.6637 16.7072 28 15 28C13.2928 28 11.6023 27.6637 10.0251 27.0104C8.44788 26.3571 7.01477 25.3995 5.80761 24.1924C4.60045 22.9852 3.64288 21.5521 2.98957 19.9749C2.33625 18.3977 2 16.7072 2 15C2 11.5522 3.36964 8.24558 5.80761 5.80761C8.24558 3.36964 11.5522 2 15 2C18.4478 2 21.7544 3.36964 24.1924 5.80761C26.6304 8.24558 28 11.5522 28 15Z'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M23.6667 6.33333L6.33333 23.6667'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
