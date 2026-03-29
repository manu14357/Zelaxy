import type { SVGProps } from 'react'

export function BedrockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <path fill='#FF9900' d='M12 2L3 7v10l9 5 9-5V7l-9-5z' />
      <path fill='#232F3E' d='M12 4.5l6 3.3v6.6l-6 3.3-6-3.3V7.8l6-3.3z' />
      <path fill='#FF9900' d='M12 8v8l4-2.2V9.8L12 8z' />
      <path fill='#FBBF24' d='M12 8L8 9.8v4l4 2.2V8z' />
    </svg>
  )
}
