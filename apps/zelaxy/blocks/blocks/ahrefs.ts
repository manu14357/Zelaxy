import { SearchIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const AhrefsBlock: BlockConfig = {
  type: 'ahrefs',
  name: 'Ahrefs',
  description: 'Retrieve SEO metrics, backlinks, and keyword data from Ahrefs',
  longDescription:
    'Integrate Ahrefs SEO data into your workflows. Get domain ratings, backlink profiles, organic keyword rankings, and more.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E0E0E0',
  icon: SearchIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Domain Rating', id: 'ahrefs_domain_rating' },
        { label: 'Backlinks', id: 'ahrefs_backlinks' },
        { label: 'Organic Keywords', id: 'ahrefs_organic_keywords' },
        { label: 'Top Pages', id: 'ahrefs_top_pages' },
        { label: 'Referring Domains', id: 'ahrefs_referring_domains' },
      ],
      required: true,
    },
    {
      id: 'target',
      title: 'Target (Domain/URL)',
      type: 'short-input',
      layout: 'full',
      placeholder: 'example.com',
      required: true,
    },
    {
      id: 'mode',
      title: 'Mode',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Domain', id: 'domain' },
        { label: 'Subdomains', id: 'subdomains' },
        { label: 'Prefix', id: 'prefix' },
        { label: 'Exact', id: 'exact' },
      ],
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
    },
    {
      id: 'date',
      title: 'Date',
      type: 'short-input',
      layout: 'half',
      placeholder: 'YYYY-MM-DD',
    },
  ],
  tools: {
    access: [
      'ahrefs_domain_rating',
      'ahrefs_backlinks',
      'ahrefs_organic_keywords',
      'ahrefs_top_pages',
      'ahrefs_referring_domains',
    ],
    config: {
      tool: (params) => params.operation || 'ahrefs_domain_rating',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    target: { type: 'string', description: 'Target domain or URL' },
    mode: { type: 'string', description: 'Target mode' },
    limit: { type: 'string', description: 'Result limit' },
    date: { type: 'string', description: 'Date for historical data' },
  },
  outputs: {
    domainRating: { type: 'number', description: 'Domain rating score' },
    backlinks: { type: 'json', description: 'Backlink data' },
    refDomains: { type: 'number', description: 'Number of referring domains' },
    keywords: { type: 'json', description: 'Keyword rankings' },
  },
}
