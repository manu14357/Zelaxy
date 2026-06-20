import { SimilarwebIcon } from '@/components/icons/similarweb-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SimilarwebResponse } from '@/tools/similarweb/types'

export const SimilarwebBlock: BlockConfig<SimilarwebResponse> = {
  type: 'similarweb',
  name: 'SimilarWeb',
  description: 'Get website traffic and rank data from SimilarWeb',
  longDescription:
    'Retrieve total website visits and engagement over time and the global rank of a website through the SimilarWeb API. Authenticate with a SimilarWeb API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#0061FF',
  icon: SimilarwebIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Total traffic', id: 'similarweb_total_traffic' },
        { label: 'Website rank', id: 'similarweb_website_rank' },
      ],
      value: () => 'similarweb_total_traffic',
    },
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      layout: 'full',
      placeholder: 'example.com',
      condition: {
        field: 'operation',
        value: ['similarweb_total_traffic', 'similarweb_website_rank'],
      },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your SimilarWeb API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['similarweb_total_traffic', 'similarweb_website_rank'],
    config: {
      tool: (params) => params.operation || 'similarweb_total_traffic',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'SimilarWeb API key' },
    domain: { type: 'string', description: 'Website domain to analyze' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from SimilarWeb' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
