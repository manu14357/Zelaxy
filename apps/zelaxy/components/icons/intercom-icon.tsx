import type { SVGProps } from 'react'

export function IntercomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' {...props}>
      <rect fill='#1F8DED' width='24' height='24' rx='4' />
      <path
        fill='#fff'
        d='M16.4 13.4a.6.6 0 0 1-1 .46c-.9-.74-2.2-1.16-3.4-1.16s-2.5.42-3.4 1.16a.6.6 0 1 1-.76-.92C8.96 12 10.5 11.5 12 11.5s3.04.5 4.16 1.44a.6.6 0 0 1 .24.46zM8 6.6a.6.6 0 0 1 1.2 0v5.2a.6.6 0 0 1-1.2 0V6.6zm2.6-.6a.6.6 0 0 1 1.2 0v6a.6.6 0 0 1-1.2 0V6zm2.6.6a.6.6 0 0 1 1.2 0v5.2a.6.6 0 0 1-1.2 0V6.6zM6 8a.6.6 0 0 1 1.2 0v3.4a.6.6 0 0 1-1.2 0V8zm9.6 0a.6.6 0 0 1 1.2 0v3.4a.6.6 0 0 1-1.2 0V8zm1.07 8.32a.6.6 0 0 1-.39.75c-.06.02-3.04.93-4.28.93s-4.22-.91-4.28-.93a.6.6 0 1 1 .36-1.14c.03 0 2.87.87 3.92.87s3.89-.86 3.92-.87a.6.6 0 0 1 .75.39z'
      />
    </svg>
  )
}
