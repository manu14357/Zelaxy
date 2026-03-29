import type { SVGProps } from 'react'

export function TwilioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <path
        fill='#F22F46'
        d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 20.25c-4.556 0-8.25-3.694-8.25-8.25S7.444 3.75 12 3.75s8.25 3.694 8.25 8.25-3.694 8.25-8.25 8.25z'
      />
      <circle fill='#F22F46' cx='14.4' cy='9.6' r='1.65' />
      <circle fill='#F22F46' cx='9.6' cy='9.6' r='1.65' />
      <circle fill='#F22F46' cx='14.4' cy='14.4' r='1.65' />
      <circle fill='#F22F46' cx='9.6' cy='14.4' r='1.65' />
    </svg>
  )
}
