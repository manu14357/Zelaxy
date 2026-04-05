import { readFileSync } from 'fs'
import { join } from 'path'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Footer } from '@/app/(landing)/components/footer'
import { legalMdxComponents } from '@/app/(landing)/components/legal-mdx-components'
import { TocSidebar } from '@/app/(landing)/components/toc-sidebar'

const tocItems = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'user-content', label: 'User Content' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'termination', label: 'Termination' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'arbitration', label: 'Arbitration Agreement' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'copyright', label: 'Copyright Policy' },
  { id: 'contact', label: 'Contact Us' },
]

export default async function TermsOfService() {
  const source = readFileSync(join(process.cwd(), 'app/(landing)/terms/terms.mdx'), 'utf8')

  return (
    <main className='relative min-h-screen bg-white text-neutral-900 dark:bg-[#060606] dark:text-white'>
      {/* Ambient glow */}
      <div className='pointer-events-none fixed inset-0 overflow-hidden'>
        <div className='-translate-x-1/2 absolute top-0 left-1/2 h-[600px] w-[900px] rounded-full bg-orange-500/[0.03] blur-[120px] dark:bg-orange-500/[0.04]' />
      </div>

      {/* Minimal top bar */}
      <header className='fixed top-0 right-0 left-0 z-50 border-neutral-200 border-b bg-white/80 backdrop-blur-xl dark:border-white/[0.05] dark:bg-[#060606]/80'>
        <div className='mx-auto flex h-14 max-w-5xl items-center justify-between px-6 sm:px-8'>
          <Link href='/' className='flex items-center gap-2.5'>
            <img src='/Zelaxy.png' alt='Zelaxy' width={24} height={24} className='h-6 w-6' />
            <span className='font-semibold text-[15px] text-neutral-900 dark:text-white'>Zelaxy</span>
          </Link>
          <Link
            href='/'
            className='inline-flex items-center gap-1.5 font-mono text-[12px] text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white'
          >
            <ArrowLeft className='h-3 w-3' />
            Back to home
          </Link>
        </div>
      </header>

      {/* Hero header */}
      <div className='border-neutral-200 border-b dark:border-white/[0.06]'>
        <div className='mx-auto max-w-5xl px-6 pt-28 pb-12 sm:px-8'>
          <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3.5 py-1.5'>
            <FileText className='h-3.5 w-3.5 text-orange-400' />
            <span className='font-mono text-[12px] text-orange-400'>Legal</span>
          </div>
          <h1 className='mb-3 font-bold text-4xl tracking-tight sm:text-5xl'>Terms of Service</h1>
          <p className='font-mono text-[13px] text-neutral-500'>Last updated — March 26, 2026</p>
        </div>
      </div>

      {/* Content area with sidebar TOC */}
      <div className='mx-auto max-w-5xl px-6 sm:px-8'>
        <div className='relative grid grid-cols-1 gap-16 py-16 lg:grid-cols-[1fr_220px]'>
          {/* Main content */}
          <div className='min-w-0'>
            {/* Intro */}
            <div className='mb-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-white/[0.06] dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-transparent'>
              <p className='text-neutral-600 leading-relaxed dark:text-neutral-400'>
                Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the
                Zelaxy platform (the &ldquo;Service&rdquo;) operated by Zelaxy, Inc
                (&ldquo;us&rdquo;, &ldquo;we&rdquo;, or &ldquo;our&rdquo;). By accessing or using
                the Service, you agree to be bound by these Terms. If you disagree with any part of
                the terms, you may not access the Service.
              </p>
            </div>

            {/* Mobile TOC */}
            <div className='mb-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 lg:hidden dark:border-white/[0.06] dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-transparent'>
              <h2 className='mb-4 font-semibold text-[13px] text-neutral-900 uppercase tracking-wide dark:text-white'>
                Table of Contents
              </h2>
              <nav className='columns-2 gap-x-6'>
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className='mb-2 block font-mono text-[12px] text-neutral-500 transition-colors hover:text-orange-400'
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Sections */}
            <div className='space-y-14'>
              <MDXRemote source={source} components={legalMdxComponents} />
            </div>
          </div>

          {/* Sticky sidebar TOC — desktop only */}
          <TocSidebar items={tocItems} />
        </div>
      </div>

      {/* Footer */}
      <div className='relative z-10'>
        <Footer />
      </div>
    </main>
  )
}
