import { GoogleAdsIcon } from '@/components/icons/google-ads-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleAdsResponse } from '@/tools/google_ads/types'

export const GoogleAdsBlock: BlockConfig<GoogleAdsResponse> = {
  type: 'google_ads',
  name: 'Google Ads',
  description: 'Query campaigns and reporting data from Google Ads',
  longDescription:
    'Run Google Ads Query Language (GAQL) queries and list campaigns through the Google Ads API. Authenticate with an OAuth access token and a developer token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4285F4',
  icon: GoogleAdsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Search (GAQL)', id: 'google_ads_search' },
        { label: 'List campaigns', id: 'google_ads_list_campaigns' },
      ],
      value: () => 'google_ads_search',
    },
    {
      id: 'customerId',
      title: 'Customer ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '1234567890',
      required: true,
    },
    // Search
    {
      id: 'query',
      title: 'GAQL Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT campaign.id, campaign.name FROM campaign',
      condition: { field: 'operation', value: 'google_ads_search' },
    },
    // List campaigns
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '50',
      condition: { field: 'operation', value: 'google_ads_list_campaigns' },
    },
    // Auth
    {
      id: 'accessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'OAuth access token',
      password: true,
      required: true,
    },
    {
      id: 'developerToken',
      title: 'Developer Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Google Ads developer token',
      password: true,
      required: true,
    },
    {
      id: 'loginCustomerId',
      title: 'Login Customer ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Manager account customer ID (optional)',
    },
  ],
  tools: {
    access: ['google_ads_search', 'google_ads_list_campaigns'],
    config: {
      tool: (params) => params.operation || 'google_ads_search',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'OAuth access token' },
    developerToken: { type: 'string', description: 'Google Ads developer token' },
    customerId: { type: 'string', description: 'Google Ads customer ID' },
    loginCustomerId: { type: 'string', description: 'Manager account customer ID' },
    query: { type: 'string', description: 'GAQL query' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result rows from Google Ads' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
