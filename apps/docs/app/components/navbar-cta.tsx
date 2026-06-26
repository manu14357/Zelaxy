import { ArrowRight } from 'lucide-react'

/**
 * Primary call-to-action shown in the navbar (right side). A fixed-height
 * gradient pill that aligns with the adjacent icon buttons and never wraps.
 * Stays visible (slightly more compact) on small screens so mobile users keep
 * the primary action. Rendered as a `custom` layout link.
 */
export function NavbarCTA() {
  return (
    <a
      href='https://zelaxy.in/signup'
      className='group inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 font-semibold text-[13px] text-white leading-none shadow-[0_2px_10px_-2px_rgba(249,115,22,0.5)] transition-all duration-200 hover:shadow-[0_4px_16px_-2px_rgba(249,115,22,0.65)] hover:brightness-105 sm:px-3.5'
    >
      <span className='max-[380px]:hidden'>Open App</span>
      <span className='hidden max-[380px]:inline'>App</span>
      <ArrowRight className='h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
    </a>
  )
}
