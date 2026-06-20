import type { SVGProps } from 'react'

export function ZendeskIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#03363D' width='24' height='24' rx='4' />
      <path fill='#fff' d='M11.3 8.3v8.2H4.5L11.3 8.3z' />
      <path fill='#fff' d='M11.3 5.5a3.4 3.4 0 0 1-6.8 0h6.8z' />
      <path fill='#fff' d='M12.7 15.7v-8.2h6.8L12.7 15.7z' />
      <path fill='#fff' d='M12.7 18.5a3.4 3.4 0 0 1 6.8 0h-6.8z' />
    </svg>
  )
}
