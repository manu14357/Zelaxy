import type { SVGProps } from 'react'

export function NewRelicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1CE783' width='24' height='24' rx='4' />
      <path
        fill='#000'
        d='M12 4 4.5 8.25v7.5L12 20l7.5-4.25v-7.5L12 4zm0 2.31 5.5 3.12v.01L12 12.56 6.5 9.44 12 6.31zM6 11.13l5 2.84v5.7l-5-2.83v-5.71z'
      />
    </svg>
  )
}
