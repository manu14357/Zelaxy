import type { SVGProps } from 'react'

export function TrelloIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#0079BF' width='24' height='24' rx='4' />
      <rect fill='#fff' x='4' y='4' width='6' height='12' rx='1' />
      <rect fill='#fff' x='14' y='4' width='6' height='7' rx='1' />
    </svg>
  )
}
