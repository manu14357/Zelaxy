import type { SVGProps } from 'react'

export function PipedriveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#017737' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12.6 6c-1.05 0-1.85.46-2.33 1.08L10.2 6.2H7.6v.16c.5.06.74.28.74.86V18h2.5v-3.8c.46.5 1.16.85 2.06.85 2.07 0 3.6-1.66 3.6-4.55C16.5 7.62 14.97 6 12.6 6zm-.62 6.95c-.96 0-1.6-.78-1.6-2.45 0-1.66.66-2.45 1.62-2.45.98 0 1.6.8 1.6 2.45 0 1.66-.64 2.45-1.62 2.45z'
      />
    </svg>
  )
}
