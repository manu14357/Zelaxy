import defaultMdxComponents from 'fumadocs-ui/mdx'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { source } from '@/lib/source'

interface PageProps {
  params: Promise<{ slug?: string[] }>
}

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  blocks: {
    label: 'Block',
    icon: '◆',
    color:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40',
  },
  tools: {
    label: 'Tool',
    icon: '⚙',
    color:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40',
  },
  triggers: {
    label: 'Trigger',
    icon: '⚡',
    color:
      'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200/60 dark:border-red-800/40',
  },
}

function getCategoryInfo(slug: string[] | undefined) {
  if (!slug || slug.length === 0) return null
  return categoryConfig[slug[0]] ?? null
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const category = getCategoryInfo(params.slug)
  const isSubpage = params.slug && params.slug.length > 1

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <div className='space-y-4'>
        {category && isSubpage && (
          <div className='flex items-center gap-2'>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium text-[11px] uppercase tracking-[0.08em] ${category.color}`}
            >
              <span className='text-[9px]'>{category.icon}</span>
              {category.label}
            </span>
          </div>
        )}
        <DocsTitle className='font-semibold text-2xl leading-tight tracking-[-0.025em] sm:text-3xl'>
          {page.data.title}
        </DocsTitle>
        {page.data.description && (
          <DocsDescription className='max-w-2xl font-light text-[15px] text-neutral-500 leading-relaxed sm:text-base dark:text-neutral-400'>
            {page.data.description}
          </DocsDescription>
        )}
      </div>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const category = getCategoryInfo(params.slug)
  const titlePrefix = category ? `${category.label}: ` : ''
  const title = `${titlePrefix}${page.data.title}`
  const description =
    page.data.description ||
    `Learn about ${page.data.title} in the Zelaxy documentation — AI agent builder reference.`
  const docsUrl = 'https://docs.zelaxy.in'
  const pageUrl = `${docsUrl}${page.url}`

  return {
    title,
    description,
    alternates: {
      canonical: page.url,
    },
    openGraph: {
      title: `${title} — Zelaxy Docs`,
      description,
      url: pageUrl,
      type: 'article',
      siteName: 'Zelaxy Documentation',
      images: [
        {
          url: 'https://zelaxy.in/social/facebook.png',
          width: 1200,
          height: 630,
          alt: `${page.data.title} — Zelaxy Docs`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: `${title} — Zelaxy Docs`,
      description,
      site: '@zelaxy',
    },
  }
}
