import { GooglePageSpeedIcon } from '@/components/icons/google-pagespeed-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GooglePagespeedResponse } from '@/tools/google_pagespeed/types'

export const GooglePagespeedBlock: BlockConfig<GooglePagespeedResponse> = {
  type: 'google_pagespeed',
  name: 'Google PageSpeed',
  description: 'Analyze webpage performance with PageSpeed Insights',
  longDescription:
    'Analyze a webpage for performance, accessibility, SEO, and best practices using the Google PageSpeed Insights API. Authenticate with a Google API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0F9D58',
  icon: GooglePageSpeedIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [{ label: 'Analyze', id: 'google_pagespeed_analyze' }],
      value: () => 'google_pagespeed_analyze',
    },
    // Analyze
    {
      id: 'url',
      title: 'URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com',
      condition: { field: 'operation', value: 'google_pagespeed_analyze' },
    },
    {
      id: 'strategy',
      title: 'Strategy',
      type: 'short-input',
      layout: 'half',
      placeholder: 'mobile or desktop',
      condition: { field: 'operation', value: 'google_pagespeed_analyze' },
    },
    {
      id: 'category',
      title: 'Category',
      type: 'short-input',
      layout: 'half',
      placeholder: 'performance',
      condition: { field: 'operation', value: 'google_pagespeed_analyze' },
    },
    {
      id: 'apiKey',
      title: 'Google API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Google API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['google_pagespeed_analyze'],
    config: {
      tool: (params) => params.operation || 'google_pagespeed_analyze',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Google API key' },
    url: { type: 'string', description: 'URL of the webpage to analyze' },
    strategy: { type: 'string', description: 'Analysis strategy (mobile or desktop)' },
    category: { type: 'string', description: 'Lighthouse category to analyze' },
  },
  outputs: {
    data: { type: 'json', description: 'PageSpeed Insights analysis result' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
