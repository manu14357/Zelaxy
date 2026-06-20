import type { SVGProps } from 'react'

export function SpotifyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1DB954' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm3.66 11.54a.5.5 0 0 1-.69.17c-1.88-1.15-4.25-1.41-7.04-.77a.5.5 0 1 1-.22-.97c3.05-.7 5.67-.4 7.78.9a.5.5 0 0 1 .17.67zm.98-2.18a.62.62 0 0 1-.86.21c-2.15-1.32-5.43-1.7-7.97-.93a.62.62 0 1 1-.36-1.2c2.9-.88 6.52-.45 8.98 1.06a.62.62 0 0 1 .21.86zm.08-2.27c-2.58-1.53-6.84-1.67-9.3-.93a.75.75 0 1 1-.43-1.44c2.83-.86 7.53-.69 10.5 1.07a.75.75 0 1 1-.77 1.3z'
      />
    </svg>
  )
}
