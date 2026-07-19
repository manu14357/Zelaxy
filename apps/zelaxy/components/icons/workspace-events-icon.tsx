import type { SVGProps } from 'react'

export function WorkspaceEventsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#10B981' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4a4 4 0 0 0-4 4v2.5c0 .9-.35 1.76-.98 2.4L6 16h12l-1.02-1.1a3.4 3.4 0 0 1-.98-2.4V8a4 4 0 0 0-4-4zm0 15a2.2 2.2 0 0 0 2.2-2H9.8A2.2 2.2 0 0 0 12 19z'
      />
    </svg>
  )
}
