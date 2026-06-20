import type { SVGProps } from 'react'

export function GongIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#8039DF' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5a7 7 0 1 0 4.95 11.95l-1.42-1.42A5 5 0 1 1 17 12h-2a3 3 0 1 0-.88 2.12l1.42 1.42A5 5 0 0 0 17 12h2a7 7 0 0 0-7-7z'
      />
      <circle fill='#fff' cx='12' cy='12' r='1.6' />
    </svg>
  )
}
