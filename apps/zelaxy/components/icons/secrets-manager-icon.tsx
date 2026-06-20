import type { SVGProps } from 'react'

export function SecretsManagerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#DD344C' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4a4 4 0 0 0-4 4v2H7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1V8a4 4 0 0 0-4-4zm-2 6V8a2 2 0 1 1 4 0v2h-4zm3 5.7V18h-2v-2.3a1.5 1.5 0 1 1 2 0z'
      />
    </svg>
  )
}
