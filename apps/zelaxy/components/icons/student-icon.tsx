import type { SVGProps } from 'react'

export function StudentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='30'
      height='27'
      viewBox='0 0 30 27'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M28 9.1498V15.6498M17.8821 2.6498C16.9814 2.22228 15.997 2.00049 15 2.00049C14.003 2.00049 13.0186 2.22228 12.1179 2.6498L3.4196 6.7279C1.5268 7.6145 1.5268 10.6851 3.4196 11.5717L12.1166 15.6498C13.0174 16.0775 14.0021 16.2994 14.9993 16.2994C15.9966 16.2994 16.9813 16.0775 17.8821 15.6498L26.5804 11.5717C28.4732 10.6851 28.4732 7.6145 26.5804 6.7279L17.8821 2.6498Z'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5.90039 13.0498V19.7123C5.90039 23.5057 12.0026 25.3998 15.0004 25.3998C17.9982 25.3998 24.1004 23.5057 24.1004 19.7123V13.0498'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
