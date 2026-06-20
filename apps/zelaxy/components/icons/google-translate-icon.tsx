import type { SVGProps } from 'react'

export function GoogleTranslateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#4285F4' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M11 6H4v2h2.7c-.3.9-.8 1.7-1.4 2.5-.5-.6-.9-1.2-1.2-1.8H3a8 8 0 0 0 1.6 2.9L2.5 13.6l.7.7 2-2 1.3 1.3.4-1.1L5.7 11A11 11 0 0 0 8 7.3V8h1V6h2zM14.5 11h-2L9 19h1.6l.7-2h3l.7 2H17l-3.5-8h1zm-2.7 4.5L13 12l1.2 3.5h-2.4z'
      />
    </svg>
  )
}
