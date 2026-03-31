'use client'

import { useEffect, useRef, useState } from 'react'

interface TocItem {
  id: string
  label: string
}

export function TocSidebar({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const headingEls = items
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    )

    headingEls.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [items])

  return (
    <aside className='hidden lg:block'>
      <div className='sticky top-24 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent p-5'>
        <h4 className='mb-4 font-semibold text-[10px] tracking-widest text-neutral-600 uppercase'>
          On this page
        </h4>
        <nav className='space-y-0.5'>
          {items.map((item) => {
            const isActive = activeId === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={[
                  'flex items-center gap-2 rounded-md px-2 py-1 font-mono text-[12px] transition-all duration-150',
                  isActive
                    ? 'bg-orange-400/10 text-orange-400'
                    : 'text-neutral-600 hover:bg-white/[0.04] hover:text-neutral-300',
                ].join(' ')}
              >
                {isActive && <span className='h-3.5 w-0.5 shrink-0 rounded-full bg-orange-400' />}
                {item.label}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
