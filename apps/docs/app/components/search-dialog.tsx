'use client'

import { useMemo, useState } from 'react'
import { useDocsSearch } from 'fumadocs-core/search/client'
import { useOnChange } from 'fumadocs-core/utils/use-on-change'
import type { SharedProps } from 'fumadocs-ui/components/dialog/search'
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  TagsList,
  TagsListItem,
} from 'fumadocs-ui/components/dialog/search'
import type { SearchLink, TagItem } from 'fumadocs-ui/contexts/search'

/* ──────────────────────────────────────────────────────────────────────────
 * Custom replacement for fumadocs-ui's `DefaultSearchDialog`.
 *
 * Upstream renders `<SearchDialogFooter>` (the section-tag filter row) as a
 * sibling of `<SearchDialogContent>` instead of inside it. Only the content
 * and overlay are gated by Radix's open-state (via internal `Presence`); the
 * footer is a plain unguarded `<div>`, so it's always mounted in the live DOM
 * — regardless of whether the dialog is open — right where `<RootProvider>`
 * sits in the tree. On this site that put a second, unstyled row of section
 * links ("Get Started / Blocks / Tools / ...") above the announcement banner
 * at all times. Moving the footer inside `SearchDialogContent` here makes it
 * share the same open/closed gating as the rest of the dialog.
 * ────────────────────────────────────────────────────────────────────────── */

interface CustomSearchDialogProps extends SharedProps {
  links?: SearchLink[]
  type?: 'fetch' | 'static'
  defaultTag?: string
  tags?: TagItem[]
  api?: string
  delayMs?: number
  allowClear?: boolean
}

export default function CustomSearchDialog({
  defaultTag,
  tags = [],
  api,
  delayMs,
  type = 'fetch',
  allowClear = false,
  links = [],
  ...props
}: CustomSearchDialogProps) {
  const [tag, setTag] = useState(defaultTag)
  const { search, setSearch, query } = useDocsSearch(
    type === 'fetch'
      ? { type: 'fetch', api, tag, delayMs }
      : { type: 'static', from: api, tag, delayMs }
  )

  const defaultItems = useMemo(() => {
    if (links.length === 0) return null
    return links.map(([name, link]) => ({
      type: 'page' as const,
      id: name,
      content: name,
      url: link,
    }))
  }, [links])

  useOnChange(defaultTag, (v) => {
    setTag(v)
  })

  return (
    <SearchDialog search={search} onSearchChange={setSearch} isLoading={query.isLoading} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : defaultItems} />
        <SearchDialogFooter>
          {tags.length > 0 && (
            <TagsList tag={tag} onTagChange={setTag} allowClear={allowClear}>
              {tags.map((t) => (
                <TagsListItem key={t.value} value={t.value}>
                  {t.name}
                </TagsListItem>
              ))}
            </TagsList>
          )}
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  )
}
