import type { SVGProps } from 'react'

export function QdrantIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <path
        fill='#DC244C'
        d='M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.2l7.5 4.1v5.5L16 16v-4.8L12 8.5 8 11.2V16l-3.5-1.9V8.3L12 4.2z'
      />
      <path fill='#B71C3C' d='M12 8.5l4 2.7V16l-4 2.2L8 16v-4.8l4-2.7z' />
    </svg>
  )
}
