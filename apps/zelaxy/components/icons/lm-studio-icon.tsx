import type { SVGProps } from 'react'

export function LMStudioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#6C47FF' width='24' height='24' rx='6' />
      <path fill='#fff' d='M7 6v12h2V6H7zm4 4v8h2v-8h-2zm4-2v10h2V8h-2z' />
    </svg>
  )
}
