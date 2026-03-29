import type { SVGProps } from 'react'

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      width='29'
      height='35'
      viewBox='0 0 29 35'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M24.9 12.4L23.444 26.9565C23.2239 29.1631 23.1147 30.2655 22.612 31.0992C22.1711 31.8331 21.5227 32.42 20.7487 32.7857C19.8699 33.2 18.764 33.2 16.5453 33.2H12.4547C10.2377 33.2 9.13013 33.2 8.25133 32.784C7.47662 32.4185 6.8276 31.8316 6.38627 31.0975C5.88707 30.2655 5.77613 29.1631 5.55427 26.9565L4.1 12.4M17.1 23.6667V15M11.9 23.6667V15M1.5 8.06667H9.49933M9.49933 8.06667L10.1684 3.4352C10.3625 2.5928 11.0628 2 11.8671 2H17.1329C17.9372 2 18.6357 2.5928 18.8316 3.4352L19.5007 8.06667M9.49933 8.06667H19.5007M19.5007 8.06667H27.5'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
