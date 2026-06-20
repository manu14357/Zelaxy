import type { SVGProps } from 'react'

export function InfisicalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#EB5E34' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4a4 4 0 0 0-4 4v2H7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1V8a4 4 0 0 0-4-4zm-2 4a2 2 0 1 1 4 0v2h-4V8zm2 6a1.25 1.25 0 0 1 .75 2.25V18a.75.75 0 0 1-1.5 0v-1.75A1.25 1.25 0 0 1 12 14z'
      />
    </svg>
  )
}
