import type { SVGProps } from 'react'
import { createElement } from 'react'
import { Activity } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const ProfoundIcon = (props: SVGProps<SVGSVGElement>) => createElement(Activity, props)

const CATEGORY_REPORT_OPS = [
  'visibility_report',
  'sentiment_report',
  'citations_report',
  'prompt_answers',
  'query_fanouts',
]

const DOMAIN_REPORT_OPS = ['bots_report', 'referrals_report', 'raw_logs', 'bot_logs']

const ALL_REPORT_OPS = [...CATEGORY_REPORT_OPS, ...DOMAIN_REPORT_OPS]

const CATEGORY_ID_OPS = [
  ...CATEGORY_REPORT_OPS,
  'category_topics',
  'category_tags',
  'category_prompts',
  'category_assets',
  'category_personas',
]

const DATE_REQUIRED_CATEGORY_OPS = [
  'visibility_report',
  'sentiment_report',
  'citations_report',
  'prompt_answers',
  'query_fanouts',
  'prompt_volume',
]

const DATE_REQUIRED_ALL_OPS = [...DATE_REQUIRED_CATEGORY_OPS, ...DOMAIN_REPORT_OPS]

const METRICS_REPORT_OPS = [
  'visibility_report',
  'sentiment_report',
  'citations_report',
  'bots_report',
  'referrals_report',
  'query_fanouts',
  'prompt_volume',
]

const DIMENSION_OPS = [
  'visibility_report',
  'sentiment_report',
  'citations_report',
  'bots_report',
  'referrals_report',
  'query_fanouts',
  'raw_logs',
  'bot_logs',
  'prompt_volume',
]

const FILTER_OPS = [...ALL_REPORT_OPS, 'prompt_volume']

export const ProfoundBlock: BlockConfig = {
  type: 'profound',
  name: 'Profound',
  description: 'AI visibility and analytics with Profound',
  longDescription:
    'Track how your brand appears across AI platforms. Monitor visibility scores, sentiment, citations, bot traffic, referrals, content optimization, and prompt volumes with Profound.',
  docsLink: 'https://docs.zelaxy.ai/tools/profound',
  category: 'tools',
  bgColor: '#000000',
  icon: ProfoundIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'List Categories', id: 'list_categories' },
        { label: 'List Regions', id: 'list_regions' },
        { label: 'List Models', id: 'list_models' },
        { label: 'List Domains', id: 'list_domains' },
        { label: 'List Assets', id: 'list_assets' },
        { label: 'List Personas', id: 'list_personas' },
        { label: 'Category Topics', id: 'category_topics' },
        { label: 'Category Tags', id: 'category_tags' },
        { label: 'Category Prompts', id: 'category_prompts' },
        { label: 'Category Assets', id: 'category_assets' },
        { label: 'Category Personas', id: 'category_personas' },
        { label: 'Visibility Report', id: 'visibility_report' },
        { label: 'Sentiment Report', id: 'sentiment_report' },
        { label: 'Citations Report', id: 'citations_report' },
        { label: 'Query Fanouts', id: 'query_fanouts' },
        { label: 'Prompt Answers', id: 'prompt_answers' },
        { label: 'Bots Report', id: 'bots_report' },
        { label: 'Referrals Report', id: 'referrals_report' },
        { label: 'Raw Logs', id: 'raw_logs' },
        { label: 'Bot Logs', id: 'bot_logs' },
        { label: 'List Optimizations', id: 'list_optimizations' },
        { label: 'Optimization Analysis', id: 'optimization_analysis' },
        { label: 'Prompt Volume', id: 'prompt_volume' },
        { label: 'Citation Prompts', id: 'citation_prompts' },
      ],
      value: () => 'visibility_report',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      placeholder: 'Enter your Profound API key',
      required: true,
      password: true,
    },
    {
      id: 'categoryId',
      title: 'Category ID',
      type: 'short-input',
      placeholder: 'Category UUID',
      required: true,
      condition: { field: 'operation', value: CATEGORY_ID_OPS },
    },
    {
      id: 'domain',
      title: 'Domain',
      type: 'short-input',
      placeholder: 'e.g. example.com',
      required: true,
      condition: { field: 'operation', value: DOMAIN_REPORT_OPS },
    },
    {
      id: 'inputDomain',
      title: 'Domain',
      type: 'short-input',
      placeholder: 'e.g. ramp.com',
      required: true,
      condition: { field: 'operation', value: 'citation_prompts' },
    },
    {
      id: 'assetId',
      title: 'Asset ID',
      type: 'short-input',
      placeholder: 'Asset UUID',
      required: true,
      condition: { field: 'operation', value: ['list_optimizations', 'optimization_analysis'] },
    },
    {
      id: 'contentId',
      title: 'Content ID',
      type: 'short-input',
      placeholder: 'Content/optimization UUID',
      required: true,
      condition: { field: 'operation', value: 'optimization_analysis' },
    },
    {
      id: 'startDate',
      title: 'Start Date',
      type: 'short-input',
      placeholder: 'YYYY-MM-DD',
      required: true,
      condition: { field: 'operation', value: DATE_REQUIRED_ALL_OPS },
      wandConfig: {
        enabled: true,
        prompt: 'Generate a date in YYYY-MM-DD format. Return ONLY the date string.',
      },
    },
    {
      id: 'endDate',
      title: 'End Date',
      type: 'short-input',
      placeholder: 'YYYY-MM-DD',
      required: true,
      condition: { field: 'operation', value: DATE_REQUIRED_ALL_OPS },
      wandConfig: {
        enabled: true,
        prompt: 'Generate a date in YYYY-MM-DD format. Return ONLY the date string.',
      },
    },
    {
      id: 'visibilityMetrics',
      title: 'Metrics',
      type: 'short-input',
      placeholder: 'share_of_voice, visibility_score, mentions_count',
      required: true,
      condition: { field: 'operation', value: 'visibility_report' },
    },
    {
      id: 'sentimentMetrics',
      title: 'Metrics',
      type: 'short-input',
      placeholder: 'positive, negative, occurrences',
      required: true,
      condition: { field: 'operation', value: 'sentiment_report' },
    },
    {
      id: 'citationsMetrics',
      title: 'Metrics',
      type: 'short-input',
      placeholder: 'count, citation_share',
      required: true,
      condition: { field: 'operation', value: 'citations_report' },
    },
    {
      id: 'botsMetrics',
      title: 'Metrics',
      type: 'short-input',
      placeholder: 'count, citations, indexing, training',
      required: true,
      condition: { field: 'operation', value: 'bots_report' },
    },
    {
      id: 'referralsMetrics',
      title: 'Metrics',
      type: 'short-input',
      placeholder: 'visits, last_visit',
      required: true,
      condition: { field: 'operation', value: 'referrals_report' },
    },
    {
      id: 'fanoutsMetrics',
      title: 'Metrics',
      type: 'short-input',
      placeholder: 'fanouts_per_execution, total_fanouts, share',
      required: true,
      condition: { field: 'operation', value: 'query_fanouts' },
    },
    {
      id: 'volumeMetrics',
      title: 'Metrics',
      type: 'short-input',
      placeholder: 'volume, change',
      required: true,
      condition: { field: 'operation', value: 'prompt_volume' },
    },
    {
      id: 'dimensions',
      title: 'Dimensions',
      type: 'short-input',
      placeholder: 'e.g. date, asset_name, model',
      condition: { field: 'operation', value: DIMENSION_OPS },
      mode: 'advanced',
    },
    {
      id: 'dateInterval',
      title: 'Date Interval',
      type: 'dropdown',
      options: [
        { label: 'Day', id: 'day' },
        { label: 'Hour', id: 'hour' },
        { label: 'Week', id: 'week' },
        { label: 'Month', id: 'month' },
        { label: 'Year', id: 'year' },
      ],
      condition: { field: 'operation', value: METRICS_REPORT_OPS },
      mode: 'advanced',
    },
    {
      id: 'filters',
      title: 'Filters',
      type: 'long-input',
      placeholder: '[{"field":"asset_name","operator":"is","value":"Company"}]',
      condition: { field: 'operation', value: FILTER_OPS },
      mode: 'advanced',
      wandConfig: {
        enabled: true,
        prompt: 'Generate a JSON array of filter objects. Each object has "field", "operator", and "value" keys. Return ONLY valid JSON.',
        generationType: 'json-object',
      },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      placeholder: '10000',
      condition: {
        field: 'operation',
        value: [...FILTER_OPS, 'category_prompts', 'list_optimizations'],
      },
      mode: 'advanced',
    },
    {
      id: 'cursor',
      title: 'Cursor',
      type: 'short-input',
      placeholder: 'Pagination cursor from previous response',
      condition: { field: 'operation', value: 'category_prompts' },
      mode: 'advanced',
    },
    {
      id: 'promptType',
      title: 'Prompt Type',
      type: 'short-input',
      placeholder: 'visibility, sentiment',
      condition: { field: 'operation', value: 'category_prompts' },
      mode: 'advanced',
    },
    {
      id: 'offset',
      title: 'Offset',
      type: 'short-input',
      placeholder: '0',
      condition: { field: 'operation', value: 'list_optimizations' },
      mode: 'advanced',
    },
  ],
  tools: {
    access: [
      'profound_list_categories',
      'profound_list_regions',
      'profound_list_models',
      'profound_list_domains',
      'profound_list_assets',
      'profound_list_personas',
      'profound_category_topics',
      'profound_category_tags',
      'profound_category_prompts',
      'profound_category_assets',
      'profound_category_personas',
      'profound_visibility_report',
      'profound_sentiment_report',
      'profound_citations_report',
      'profound_query_fanouts',
      'profound_prompt_answers',
      'profound_bots_report',
      'profound_referrals_report',
      'profound_raw_logs',
      'profound_bot_logs',
      'profound_list_optimizations',
      'profound_optimization_analysis',
      'profound_prompt_volume',
      'profound_citation_prompts',
    ],
    config: {
      tool: (params) => `profound_${params.operation}`,
      params: (params) => {
        const result: Record<string, unknown> = {}
        const metricsMap: Record<string, string> = {
          visibility_report: 'visibilityMetrics',
          sentiment_report: 'sentimentMetrics',
          citations_report: 'citationsMetrics',
          bots_report: 'botsMetrics',
          referrals_report: 'referralsMetrics',
          query_fanouts: 'fanoutsMetrics',
          prompt_volume: 'volumeMetrics',
        }
        const metricsField = metricsMap[params.operation as string]
        if (metricsField && params[metricsField]) {
          result.metrics = params[metricsField]
        }
        if (params.limit != null) result.limit = Number(params.limit)
        if (params.offset != null) result.offset = Number(params.offset)
        return result
      },
    },
  },
  inputs: {
    apiKey: { type: 'string', description: 'Profound API key' },
    categoryId: { type: 'string', description: 'Category UUID' },
    domain: { type: 'string', description: 'Domain (e.g. example.com)' },
    inputDomain: { type: 'string', description: 'Domain for citation prompts' },
    assetId: { type: 'string', description: 'Asset UUID' },
    contentId: { type: 'string', description: 'Content/optimization UUID' },
    startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
    endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
    metrics: { type: 'string', description: 'Comma-separated metrics to retrieve' },
    dimensions: { type: 'string', description: 'Comma-separated dimensions' },
    dateInterval: { type: 'string', description: 'Date grouping interval' },
    filters: { type: 'string', description: 'JSON array of filter objects' },
    limit: { type: 'number', description: 'Max results to return' },
    offset: { type: 'number', description: 'Pagination offset' },
    cursor: { type: 'string', description: 'Pagination cursor' },
    promptType: { type: 'string', description: 'Prompt type filter' },
  },
  outputs: {
    response: { type: 'json', description: 'API response data' },
  },
}
