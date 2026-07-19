import type { SVGProps } from 'react'

export function SftpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width='24'
      height='24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      {/* Folder base — the remote file store */}
      <path d='M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2' />
      <path d='M3 7v10a2 2 0 0 0 2 2h6' />
      {/* Secure transfer — up/down arrows with a lock hint */}
      <path d='M16 21v-6' />
      <path d='m13.5 17.5 2.5-2.5 2.5 2.5' />
      <rect x='14' y='9' width='7' height='4' rx='1' />
      <path d='M15.5 9V7.5a1.5 1.5 0 0 1 3 0V9' />
    </svg>
  )
}
