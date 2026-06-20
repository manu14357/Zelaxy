import type { SVGProps } from 'react'

export function MongodbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#00ED64' width='24' height='24' rx='4' />
      <path
        fill='#001E2B'
        d='M12.4 4.3c-.1-.2-.3-.3-.4-.3s-.3.1-.4.3c-.5 1-3.6 4.5-3.6 8.4 0 2.9 2 4.4 3.3 5.1.2.1.2.2.2.4l.1 1.1c0 .2.1.3.3.3h.2c.2 0 .3-.1.3-.3l.1-1.1c0-.2.1-.3.2-.4 1.3-.7 3.3-2.2 3.3-5.1 0-3.9-3.1-7.4-3.6-8.4zm-.4 12.6c-.1 0-.2-.1-.2-.3l-.1-7.9c0-.1.1-.2.2-.2s.2.1.2.2l-.1 7.9c0 .2-.1.3-.1.3z'
      />
    </svg>
  )
}
