import type { SVGProps } from 'react'

export function IdentityCenterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#FF9900' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 7c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4z'
      />
    </svg>
  )
}
