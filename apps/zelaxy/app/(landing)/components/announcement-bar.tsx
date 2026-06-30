'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'

/* ─── Edit these constants to update the announcement ───────────────────── */
const SHOW = true
const ID = 'zelaxy-landing-2026-launch-v1'
const MESSAGE = '270 blocks · 250+ tools · 25 model providers — all live'
const HREF = 'https://docs.zelaxy.com/docs/blocks'
const CTA = 'Explore the docs'
/* ─────────────────────────────────────────────────────────────────────────── */

const ANN_H = '40px'
const STORAGE_KEY = `ann-dismissed-${ID}`

function setAnnHeight(h: string) {
  document.documentElement.style.setProperty('--bp-ann-h', h)
}

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!SHOW) return
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') return
    } catch {}
    setVisible(true)
    setAnnHeight(ANN_H)
  }, [])

  const dismiss = () => {
    setVisible(false)
    setAnnHeight('0px')
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
  }

  if (!visible) return null

  return (
    <div className='ann-bar fixed inset-x-0 top-0 z-[60] flex items-center justify-center'>
      {/*
        Layer order (DOM = paint order, no z-index needed):
        1. ann-bg  — the page background colour fills the bar first
        2. ann-rainbow — the RGBA gradient on top; where gradient is transparent,
                         ann-bg colour shows through (matches Fumadocs behaviour)
        3. content <a> / <button> — last in DOM, renders above both layers
      */}
      <div className='ann-bg absolute inset-0' />
      <div className='ann-rainbow absolute inset-0' />

      {/* content */}
      <a
        href={HREF}
        target='_blank'
        rel='noopener noreferrer'
        className='ann-text group relative flex min-w-0 items-center gap-2 px-10 font-medium text-[13px]'
      >
        <span className='shrink-0 rounded-full bg-white/20 px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider'>
          New
        </span>
        <span className='truncate opacity-90'>{MESSAGE}</span>
        <span className='hidden shrink-0 items-center gap-1 font-semibold underline-offset-2 opacity-80 group-hover:underline group-hover:opacity-100 sm:inline-flex'>
          {CTA}
          <ArrowRight className='h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
        </span>
      </a>

      {/* dismiss */}
      <button
        type='button'
        onClick={dismiss}
        aria-label='Dismiss announcement'
        className='ann-close -translate-y-1/2 absolute top-1/2 right-3 rounded p-1 transition-opacity hover:opacity-100'
      >
        <X className='h-3.5 w-3.5' />
      </button>
    </div>
  )
}
