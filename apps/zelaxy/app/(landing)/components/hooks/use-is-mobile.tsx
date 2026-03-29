import { useEffect, useState } from 'react'

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const checkMobile = () => {
      // Use modern viewport units and match Apple's breakpoints
      const width = window.innerWidth
      setIsMobile(width < 768) // iPad portrait and below
    }

    checkMobile()

    // Use modern ResizeObserver if available, fallback to resize event
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(checkMobile)
      resizeObserver.observe(document.documentElement)

      return () => resizeObserver.disconnect()
    }
    window.addEventListener('resize', checkMobile, { passive: true })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return { isMobile, mounted }
}
