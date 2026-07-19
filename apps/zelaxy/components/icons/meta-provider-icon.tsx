import type { SVGProps } from 'react'

/**
 * Icon for the Meta LLM provider (Meta Model API). Named MetaProviderIcon to avoid colliding with
 * any existing Meta (Facebook) brand icon used elsewhere.
 */
export function MetaProviderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0082FB' width='24' height='24' rx='4' />
      <path
        d='M4 15c1.2-5 3-6.5 4.4-6.5 1.8 0 2.7 2 3.6 4 .9-2 1.8-4 3.6-4C17 8.5 18.8 10 20 15h-2c-.9-3.3-1.7-4.2-2.4-4.2-1 0-1.7 1.8-2.6 3.9l-1 .3-1-.3c-.9-2.1-1.6-3.9-2.6-3.9C7.7 10.8 6.9 11.7 6 15H4z'
        fill='#fff'
      />
    </svg>
  )
}
