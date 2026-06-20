import type { SVGProps } from 'react'

export function OnePasswordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0364D3' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        fillRule='evenodd'
        d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-1 5.5a1 1 0 0 1 2 0v2.382l.553-.276a1 1 0 1 1 .894 1.788L13 12.118V15.5a1 1 0 1 1-2 0V8.5z'
        clipRule='evenodd'
      />
    </svg>
  )
}
