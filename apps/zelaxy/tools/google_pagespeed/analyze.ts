import type { AnalyzeParams, GooglePagespeedAnalyzeResponse } from '@/tools/google_pagespeed/types'
import type { ToolConfig } from '@/tools/types'

export const analyzeTool: ToolConfig<AnalyzeParams, GooglePagespeedAnalyzeResponse> = {
  id: 'google_pagespeed_analyze',
  name: 'Google PageSpeed Analyze',
  description:
    'Analyze a webpage for performance, accessibility, SEO, and best practices using Google PageSpeed Insights',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google PageSpeed Insights API key',
    },
    url: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The URL of the webpage to analyze',
    },
    strategy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Analysis strategy: mobile or desktop (default mobile)',
    },
    category: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Lighthouse category: performance, accessibility, best-practices, or seo',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
      url.searchParams.append('url', params.url)
      url.searchParams.append('key', params.apiKey)
      url.searchParams.append('strategy', params.strategy || 'mobile')
      url.searchParams.append('category', params.category || 'performance')
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      Accept: 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    return {
      success: true,
      output: {
        data,
        metadata: { id: data.id, strategy: data.lighthouseResult?.configSettings?.formFactor },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The full PageSpeed Insights analysis result' },
    metadata: {
      type: 'json',
      description: 'Analysis metadata',
      properties: {
        id: { type: 'string', description: 'The analyzed URL' },
        strategy: { type: 'string', description: 'The strategy / form factor used' },
      },
    },
  },
}
