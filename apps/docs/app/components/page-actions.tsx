'use client'

import { useState } from 'react'
import { Check, ChevronDown, Copy, ExternalLink, FileText, Sparkles } from 'lucide-react'

const DOCS_ORIGIN = 'https://docs.zelaxy.in'

interface PageActionsProps {
  /** Slug segments of the current page, e.g. ['blocks', 'agent']. Empty for the index. */
  slug: string[]
  /** Canonical page path, e.g. /docs/blocks/agent */
  pageUrl: string
  title: string
}

/**
 * Modern "AI-ready" page actions: copy the page as Markdown, open it in ChatGPT / Claude, or view
 * the raw .md. The copy uses the live origin so it works on localhost and in production; the LLM
 * deep-links use the public docs origin so the assistant can fetch the page.
 */
export function PageActions({ slug, pageUrl, title }: PageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const slugQuery = slug.length ? `?slug=${slug.map(encodeURIComponent).join('/')}` : ''
  const mdApi = `/api/md${slugQuery}`
  const publicUrl = `${DOCS_ORIGIN}${pageUrl}`
  const llmPrompt = encodeURIComponent(
    `Read ${publicUrl} (raw markdown at ${DOCS_ORIGIN}${mdApi}) and help me use the Zelaxy "${title}" in a workflow.`
  )

  async function copyMarkdown() {
    try {
      const res = await fetch(mdApi)
      const text = await res.text()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore — clipboard or fetch unavailable
    }
  }

  const menuItems = [
    {
      label: 'Open in ChatGPT',
      href: `https://chatgpt.com/?q=${llmPrompt}`,
      icon: <Sparkles className='h-3.5 w-3.5 text-emerald-500' />,
    },
    {
      label: 'Open in Claude',
      href: `https://claude.ai/new?q=${llmPrompt}`,
      icon: <Sparkles className='h-3.5 w-3.5 text-orange-500' />,
    },
    {
      label: 'View as Markdown',
      href: mdApi,
      icon: <FileText className='h-3.5 w-3.5 text-neutral-500' />,
    },
  ]

  return (
    <div className='not-prose relative flex items-center gap-1.5'>
      {/* Copy as Markdown */}
      <button
        type='button'
        onClick={copyMarkdown}
        className='inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-card px-2.5 py-1.5 font-medium text-[12px] text-fd-muted-foreground transition-all duration-150 hover:border-fd-primary/30 hover:text-fd-foreground'
        aria-label='Copy page as Markdown'
      >
        {copied ? (
          <Check className='h-3.5 w-3.5 text-emerald-500' />
        ) : (
          <Copy className='h-3.5 w-3.5' />
        )}
        {copied ? 'Copied' : 'Copy page'}
      </button>

      {/* Dropdown: open in LLM / view markdown */}
      <div className='relative'>
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className='inline-flex items-center gap-1 rounded-lg border border-fd-border bg-fd-card px-2 py-1.5 font-medium text-[12px] text-fd-muted-foreground transition-all duration-150 hover:border-fd-primary/30 hover:text-fd-foreground'
          aria-label='More page actions'
          aria-expanded={open}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className='absolute right-0 z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-fd-border bg-fd-popover py-1 shadow-lg shadow-black/5'>
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2.5 px-3 py-2 text-[13px] text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground'
              >
                {item.icon}
                <span className='flex-1'>{item.label}</span>
                <ExternalLink className='h-3 w-3 opacity-40' />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
