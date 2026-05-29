import type { SVGProps } from 'react'
import { createElement } from 'react'
import { BarChart } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const PolymarketIcon = (props: SVGProps<SVGSVGElement>) => createElement(BarChart, props)

const CLOB_TOKEN_OPS = [
  'get_orderbook',
  'get_price',
  'get_midpoint',
  'get_price_history',
  'get_last_trade_price',
  'get_spread',
  'get_tick_size',
]

const PAGINATION_OPS = [
  'get_markets',
  'get_events',
  'get_tags',
  'search',
  'get_series',
  'get_trades',
  'get_positions',
  'get_activity',
  'get_leaderboard',
  'get_holders',
]

export const PolymarketBlock: BlockConfig = {
  type: 'polymarket',
  name: 'Polymarket',
  description: 'Browse and analyze Polymarket prediction markets',
  longDescription:
    'Access Polymarket prediction markets. Browse markets, events, and prices; track positions, trades, and holder data; search markets; and query CLOB price/orderbook data.',
  docsLink: 'https://docs.zelaxy.ai/tools/polymarket',
  category: 'tools',
  hideFromToolbar: true,
  bgColor: '#0A0A0A',
  icon: PolymarketIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'Get Markets', id: 'get_markets' },
        { label: 'Get Market', id: 'get_market' },
        { label: 'Get Events', id: 'get_events' },
        { label: 'Get Event', id: 'get_event' },
        { label: 'Get Tags', id: 'get_tags' },
        { label: 'Search', id: 'search' },
        { label: 'Get Series', id: 'get_series' },
        { label: 'Get Series by ID', id: 'get_series_by_id' },
        { label: 'Get Orderbook', id: 'get_orderbook' },
        { label: 'Get Price', id: 'get_price' },
        { label: 'Get Midpoint', id: 'get_midpoint' },
        { label: 'Get Price History', id: 'get_price_history' },
        { label: 'Get Last Trade Price', id: 'get_last_trade_price' },
        { label: 'Get Spread', id: 'get_spread' },
        { label: 'Get Tick Size', id: 'get_tick_size' },
        { label: 'Get Positions', id: 'get_positions' },
        { label: 'Get Trades', id: 'get_trades' },
        { label: 'Get Activity', id: 'get_activity' },
        { label: 'Get Leaderboard', id: 'get_leaderboard' },
        { label: 'Get Holders', id: 'get_holders' },
      ],
      value: () => 'get_markets',
    },
    {
      id: 'marketId',
      title: 'Market ID',
      type: 'short-input',
      placeholder: 'Market condition ID',
      required: true,
      condition: { field: 'operation', value: 'get_market' },
    },
    {
      id: 'marketSlug',
      title: 'Market Slug',
      type: 'short-input',
      placeholder: 'Market URL slug',
      condition: { field: 'operation', value: 'get_market' },
    },
    {
      id: 'eventId',
      title: 'Event ID',
      type: 'short-input',
      placeholder: 'Event ID',
      required: true,
      condition: { field: 'operation', value: 'get_event' },
    },
    {
      id: 'eventSlug',
      title: 'Event Slug',
      type: 'short-input',
      placeholder: 'Event URL slug',
      condition: { field: 'operation', value: 'get_event' },
    },
    {
      id: 'seriesId',
      title: 'Series ID',
      type: 'short-input',
      placeholder: 'Series ID',
      required: true,
      condition: { field: 'operation', value: 'get_series_by_id' },
    },
    {
      id: 'query',
      title: 'Search Query',
      type: 'short-input',
      placeholder: 'Search markets...',
      required: true,
      condition: { field: 'operation', value: 'search' },
    },
    {
      id: 'user',
      title: 'User Address',
      type: 'short-input',
      placeholder: 'Ethereum wallet address',
      required: true,
      condition: {
        field: 'operation',
        value: ['get_positions', 'get_trades', 'get_activity', 'get_leaderboard'],
      },
    },
    {
      id: 'market',
      title: 'Condition ID',
      type: 'short-input',
      placeholder: 'Condition ID filter',
      condition: { field: 'operation', value: ['get_positions', 'get_trades'] },
    },
    {
      id: 'positionEventId',
      title: 'Event ID',
      type: 'short-input',
      placeholder: 'Event ID filter',
      condition: { field: 'operation', value: ['get_positions', 'get_trades'] },
      mode: 'advanced',
    },
    {
      id: 'holdersMarket',
      title: 'Condition ID',
      type: 'short-input',
      placeholder: 'Condition ID (comma-separated)',
      required: true,
      condition: { field: 'operation', value: 'get_holders' },
    },
    {
      id: 'holdersMinBalance',
      title: 'Min Balance',
      type: 'short-input',
      placeholder: '1',
      condition: { field: 'operation', value: 'get_holders' },
      mode: 'advanced',
    },
    {
      id: 'tokenId',
      title: 'Token ID',
      type: 'short-input',
      placeholder: 'CLOB Token ID from market',
      required: true,
      condition: { field: 'operation', value: CLOB_TOKEN_OPS },
    },
    {
      id: 'side',
      title: 'Side',
      type: 'dropdown',
      options: [
        { label: 'Buy', id: 'buy' },
        { label: 'Sell', id: 'sell' },
      ],
      required: true,
      condition: { field: 'operation', value: 'get_price' },
    },
    {
      id: 'interval',
      title: 'Interval',
      type: 'dropdown',
      options: [
        { label: 'None (use timestamps)', id: '' },
        { label: '1 Minute', id: '1m' },
        { label: '1 Hour', id: '1h' },
        { label: '6 Hours', id: '6h' },
        { label: '1 Day', id: '1d' },
        { label: '1 Week', id: '1w' },
        { label: 'Max', id: 'max' },
      ],
      condition: { field: 'operation', value: 'get_price_history' },
      mode: 'advanced',
    },
    {
      id: 'fidelity',
      title: 'Fidelity (minutes)',
      type: 'short-input',
      placeholder: '60',
      condition: { field: 'operation', value: 'get_price_history' },
      mode: 'advanced',
    },
    {
      id: 'startTs',
      title: 'Start Timestamp',
      type: 'short-input',
      placeholder: 'Unix timestamp UTC',
      condition: { field: 'operation', value: 'get_price_history' },
      mode: 'advanced',
      wandConfig: {
        enabled: true,
        prompt: 'Generate a Unix timestamp in seconds. Return ONLY the number.',
        placeholder: 'Describe the start time...',
      },
    },
    {
      id: 'endTs',
      title: 'End Timestamp',
      type: 'short-input',
      placeholder: 'Unix timestamp UTC',
      condition: { field: 'operation', value: 'get_price_history' },
      mode: 'advanced',
      wandConfig: {
        enabled: true,
        prompt: 'Generate a Unix timestamp in seconds. Return ONLY the number.',
        placeholder: 'Describe the end time...',
      },
    },
    {
      id: 'closed',
      title: 'Closed Status',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Open Only', id: 'false' },
        { label: 'Closed Only', id: 'true' },
      ],
      condition: { field: 'operation', value: ['get_markets', 'get_events'] },
      mode: 'advanced',
    },
    {
      id: 'order',
      title: 'Sort By (Markets)',
      type: 'dropdown',
      options: [
        { label: 'Default', id: '' },
        { label: 'Volume', id: 'volumeNum' },
        { label: 'Liquidity', id: 'liquidityNum' },
        { label: 'Start Date', id: 'startDate' },
        { label: 'End Date', id: 'endDate' },
        { label: 'Created At', id: 'createdAt' },
        { label: 'Updated At', id: 'updatedAt' },
      ],
      condition: { field: 'operation', value: 'get_markets' },
      mode: 'advanced',
    },
    {
      id: 'orderEvents',
      title: 'Sort By (Events)',
      type: 'dropdown',
      options: [
        { label: 'Default', id: '' },
        { label: 'Volume', id: 'volume' },
        { label: 'Liquidity', id: 'liquidity' },
        { label: 'Start Date', id: 'startDate' },
        { label: 'End Date', id: 'endDate' },
        { label: 'Created At', id: 'createdAt' },
        { label: 'Updated At', id: 'updatedAt' },
      ],
      condition: { field: 'operation', value: 'get_events' },
      mode: 'advanced',
    },
    {
      id: 'ascending',
      title: 'Sort Order',
      type: 'dropdown',
      options: [
        { label: 'Descending', id: 'false' },
        { label: 'Ascending', id: 'true' },
      ],
      condition: { field: 'operation', value: ['get_markets', 'get_events'] },
      mode: 'advanced',
    },
    {
      id: 'tagId',
      title: 'Tag ID',
      type: 'short-input',
      placeholder: 'Filter by tag ID',
      condition: { field: 'operation', value: ['get_markets', 'get_events'] },
      mode: 'advanced',
    },
    // Positions filters
    {
      id: 'sizeThreshold',
      title: 'Size Threshold',
      type: 'short-input',
      placeholder: 'Minimum position size',
      condition: { field: 'operation', value: 'get_positions' },
      mode: 'advanced',
    },
    {
      id: 'redeemable',
      title: 'Redeemable',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Yes', id: 'true' },
        { label: 'No', id: 'false' },
      ],
      condition: { field: 'operation', value: 'get_positions' },
      mode: 'advanced',
    },
    {
      id: 'mergeable',
      title: 'Mergeable',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Yes', id: 'true' },
        { label: 'No', id: 'false' },
      ],
      condition: { field: 'operation', value: 'get_positions' },
      mode: 'advanced',
    },
    {
      id: 'positionSortBy',
      title: 'Sort By',
      type: 'short-input',
      placeholder: 'e.g. current_value',
      condition: { field: 'operation', value: 'get_positions' },
      mode: 'advanced',
    },
    {
      id: 'positionSortDirection',
      title: 'Sort Direction',
      type: 'dropdown',
      options: [
        { label: 'Default', id: '' },
        { label: 'Ascending', id: 'ASC' },
        { label: 'Descending', id: 'DESC' },
      ],
      condition: { field: 'operation', value: 'get_positions' },
      mode: 'advanced',
    },
    {
      id: 'positionTitle',
      title: 'Title Filter',
      type: 'short-input',
      placeholder: 'Filter positions by title',
      condition: { field: 'operation', value: 'get_positions' },
      mode: 'advanced',
    },
    // Trades filters
    {
      id: 'tradeSide',
      title: 'Side',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Buy', id: 'BUY' },
        { label: 'Sell', id: 'SELL' },
      ],
      condition: { field: 'operation', value: 'get_trades' },
      mode: 'advanced',
    },
    {
      id: 'takerOnly',
      title: 'Taker Only',
      type: 'dropdown',
      options: [
        { label: 'No', id: '' },
        { label: 'Yes', id: 'true' },
      ],
      condition: { field: 'operation', value: 'get_trades' },
      mode: 'advanced',
    },
    {
      id: 'filterType',
      title: 'Filter Type',
      type: 'dropdown',
      options: [
        { label: 'None', id: '' },
        { label: 'Cash', id: 'CASH' },
        { label: 'Tokens', id: 'TOKENS' },
      ],
      condition: { field: 'operation', value: 'get_trades' },
      mode: 'advanced',
    },
    {
      id: 'filterAmount',
      title: 'Min Amount',
      type: 'short-input',
      placeholder: 'Minimum trade amount',
      condition: { field: 'operation', value: 'get_trades' },
      mode: 'advanced',
    },
    // Activity filters
    {
      id: 'activityUser',
      title: 'User Address',
      type: 'short-input',
      placeholder: 'Filter by user address',
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    {
      id: 'activityType',
      title: 'Activity Type',
      type: 'short-input',
      placeholder: 'e.g. trade, redeem',
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    {
      id: 'activityMarket',
      title: 'Market Filter',
      type: 'short-input',
      placeholder: 'Condition ID',
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    {
      id: 'activityEventId',
      title: 'Event ID Filter',
      type: 'short-input',
      placeholder: 'Event ID',
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    {
      id: 'activitySide',
      title: 'Side',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Buy', id: 'BUY' },
        { label: 'Sell', id: 'SELL' },
      ],
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    {
      id: 'activitySortBy',
      title: 'Sort By',
      type: 'short-input',
      placeholder: 'e.g. timestamp',
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    {
      id: 'activitySortDirection',
      title: 'Sort Direction',
      type: 'dropdown',
      options: [
        { label: 'Descending', id: '' },
        { label: 'Ascending', id: 'ASC' },
      ],
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    {
      id: 'activityStart',
      title: 'Start Timestamp',
      type: 'short-input',
      placeholder: 'Unix timestamp',
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    {
      id: 'activityEnd',
      title: 'End Timestamp',
      type: 'short-input',
      placeholder: 'Unix timestamp',
      condition: { field: 'operation', value: 'get_activity' },
      mode: 'advanced',
    },
    // Leaderboard
    {
      id: 'leaderboardCategory',
      title: 'Category',
      type: 'short-input',
      placeholder: 'e.g. politics, sports',
      condition: { field: 'operation', value: 'get_leaderboard' },
      mode: 'advanced',
    },
    {
      id: 'leaderboardTimePeriod',
      title: 'Time Period',
      type: 'dropdown',
      options: [
        { label: 'All Time', id: '' },
        { label: '1 Day', id: '1d' },
        { label: '1 Week', id: '1w' },
        { label: '1 Month', id: '1m' },
      ],
      condition: { field: 'operation', value: 'get_leaderboard' },
      mode: 'advanced',
    },
    {
      id: 'leaderboardOrderBy',
      title: 'Order By',
      type: 'short-input',
      placeholder: 'e.g. pnl',
      condition: { field: 'operation', value: 'get_leaderboard' },
      mode: 'advanced',
    },
    {
      id: 'leaderboardUser',
      title: 'User Address',
      type: 'short-input',
      placeholder: 'Filter by user address',
      condition: { field: 'operation', value: 'get_leaderboard' },
      mode: 'advanced',
    },
    {
      id: 'leaderboardUserName',
      title: 'Username',
      type: 'short-input',
      placeholder: 'Filter by username',
      condition: { field: 'operation', value: 'get_leaderboard' },
      mode: 'advanced',
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      placeholder: 'Max results (default 50)',
      condition: { field: 'operation', value: PAGINATION_OPS },
      mode: 'advanced',
    },
    {
      id: 'offset',
      title: 'Offset',
      type: 'short-input',
      placeholder: 'Pagination offset',
      condition: {
        field: 'operation',
        value: [
          'get_markets', 'get_events', 'get_tags', 'get_series', 'get_trades',
          'get_positions', 'get_activity', 'get_leaderboard',
        ],
      },
      mode: 'advanced',
    },
    {
      id: 'page',
      title: 'Page',
      type: 'short-input',
      placeholder: 'Page number',
      condition: { field: 'operation', value: 'search' },
      mode: 'advanced',
    },
  ],
  tools: {
    access: [
      'polymarket_get_markets',
      'polymarket_get_market',
      'polymarket_get_events',
      'polymarket_get_event',
      'polymarket_get_tags',
      'polymarket_search',
      'polymarket_get_series',
      'polymarket_get_series_by_id',
      'polymarket_get_orderbook',
      'polymarket_get_price',
      'polymarket_get_midpoint',
      'polymarket_get_price_history',
      'polymarket_get_last_trade_price',
      'polymarket_get_spread',
      'polymarket_get_tick_size',
      'polymarket_get_positions',
      'polymarket_get_trades',
      'polymarket_get_activity',
      'polymarket_get_leaderboard',
      'polymarket_get_holders',
    ],
    config: {
      tool: (params) => {
        switch (params.operation) {
          case 'get_markets': return 'polymarket_get_markets'
          case 'get_market': return 'polymarket_get_market'
          case 'get_events': return 'polymarket_get_events'
          case 'get_event': return 'polymarket_get_event'
          case 'get_tags': return 'polymarket_get_tags'
          case 'search': return 'polymarket_search'
          case 'get_series': return 'polymarket_get_series'
          case 'get_series_by_id': return 'polymarket_get_series_by_id'
          case 'get_orderbook': return 'polymarket_get_orderbook'
          case 'get_price': return 'polymarket_get_price'
          case 'get_midpoint': return 'polymarket_get_midpoint'
          case 'get_price_history': return 'polymarket_get_price_history'
          case 'get_last_trade_price': return 'polymarket_get_last_trade_price'
          case 'get_spread': return 'polymarket_get_spread'
          case 'get_tick_size': return 'polymarket_get_tick_size'
          case 'get_positions': return 'polymarket_get_positions'
          case 'get_trades': return 'polymarket_get_trades'
          case 'get_activity': return 'polymarket_get_activity'
          case 'get_leaderboard': return 'polymarket_get_leaderboard'
          case 'get_holders': return 'polymarket_get_holders'
          default: return 'polymarket_get_markets'
        }
      },
      params: (params) => {
        const {
          operation,
          marketSlug,
          eventSlug,
          orderEvents,
          order,
          positionEventId,
          tradeSide,
          positionSortBy,
          positionSortDirection,
          positionTitle,
          activityUser,
          activityType,
          activityMarket,
          activityEventId,
          activitySide,
          activitySortBy,
          activitySortDirection,
          activityStart,
          activityEnd,
          leaderboardCategory,
          leaderboardTimePeriod,
          leaderboardOrderBy,
          leaderboardUser,
          leaderboardUserName,
          holdersMarket,
          holdersMinBalance,
          ...rest
        } = params
        const cleanParams: Record<string, unknown> = {}

        if (operation === 'get_market' && marketSlug) cleanParams.slug = marketSlug
        if (operation === 'get_event' && eventSlug) cleanParams.slug = eventSlug
        if (operation === 'get_markets' && order) cleanParams.order = order
        else if (operation === 'get_events' && orderEvents) cleanParams.order = orderEvents
        if (['get_positions', 'get_trades'].includes(operation as string) && positionEventId) cleanParams.eventId = positionEventId
        if (operation === 'get_trades' && tradeSide) cleanParams.side = tradeSide
        if (operation === 'get_positions') {
          if (positionSortBy) cleanParams.sortBy = positionSortBy
          if (positionSortDirection) cleanParams.sortDirection = positionSortDirection
          if (positionTitle) cleanParams.title = positionTitle
        }
        if (operation === 'get_activity') {
          if (activityUser) cleanParams.user = activityUser
          if (activityType) cleanParams.type = activityType
          if (activityMarket) cleanParams.market = activityMarket
          if (activityEventId) cleanParams.eventId = activityEventId
          if (activitySide) cleanParams.side = activitySide
          if (activitySortBy) cleanParams.sortBy = activitySortBy
          if (activitySortDirection) cleanParams.sortDirection = activitySortDirection
          if (activityStart) cleanParams.start = Number(activityStart)
          if (activityEnd) cleanParams.end = Number(activityEnd)
        }
        if (operation === 'get_leaderboard') {
          if (leaderboardCategory) cleanParams.category = leaderboardCategory
          if (leaderboardTimePeriod) cleanParams.timePeriod = leaderboardTimePeriod
          if (leaderboardOrderBy) cleanParams.orderBy = leaderboardOrderBy
          if (leaderboardUser) cleanParams.user = leaderboardUser
          if (leaderboardUserName) cleanParams.userName = leaderboardUserName
        }
        if (operation === 'get_holders') {
          if (holdersMarket) cleanParams.market = holdersMarket
          if (holdersMinBalance) cleanParams.minBalance = holdersMinBalance
        }
        if (operation === 'get_price_history') {
          if (rest.fidelity) cleanParams.fidelity = Number(rest.fidelity)
          if (rest.startTs) cleanParams.startTs = Number(rest.startTs)
          if (rest.endTs) cleanParams.endTs = Number(rest.endTs)
          delete rest.fidelity
          delete rest.startTs
          delete rest.endTs
        }

        for (const [key, value] of Object.entries(rest)) {
          if (value !== undefined && value !== null && value !== '') {
            cleanParams[key] = value
          }
        }

        return cleanParams
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    marketId: { type: 'string', description: 'Market ID' },
    marketSlug: { type: 'string', description: 'Market slug' },
    eventId: { type: 'string', description: 'Event ID' },
    eventSlug: { type: 'string', description: 'Event slug' },
    seriesId: { type: 'string', description: 'Series ID' },
    query: { type: 'string', description: 'Search query' },
    user: { type: 'string', description: 'User wallet address' },
    market: { type: 'string', description: 'Condition ID filter' },
    tokenId: { type: 'string', description: 'CLOB Token ID' },
    side: { type: 'string', description: 'Order side' },
    interval: { type: 'string', description: 'Price history interval' },
    fidelity: { type: 'number', description: 'Data resolution in minutes' },
    startTs: { type: 'number', description: 'Start timestamp (Unix)' },
    endTs: { type: 'number', description: 'End timestamp (Unix)' },
    limit: { type: 'string', description: 'Result limit' },
    offset: { type: 'string', description: 'Pagination offset' },
    page: { type: 'string', description: 'Page number for search' },
  },
  outputs: {
    markets: { type: 'json', description: 'Array of market objects' },
    events: { type: 'json', description: 'Array of event objects' },
    tags: { type: 'json', description: 'Array of tag objects' },
    series: { type: 'json', description: 'Array of series objects or single series' },
    market: { type: 'json', description: 'Single market object' },
    event: { type: 'json', description: 'Single event object' },
    orderbook: { type: 'json', description: 'Orderbook with bids and asks' },
    price: { type: 'number', description: 'Current price' },
    midpoint: { type: 'number', description: 'Midpoint price' },
    history: { type: 'json', description: 'Price history data' },
    lastTradePrice: { type: 'number', description: 'Last trade price' },
    spread: { type: 'number', description: 'Bid-ask spread' },
    tickSize: { type: 'number', description: 'Minimum price increment' },
    positions: { type: 'json', description: 'User positions' },
    trades: { type: 'json', description: 'Trade history' },
    activity: { type: 'json', description: 'User activity' },
    leaderboard: { type: 'json', description: 'Leaderboard entries' },
    holders: { type: 'json', description: 'Token holders' },
    results: { type: 'json', description: 'Search results' },
    data: { type: 'json', description: 'Raw API response data' },
  },
}
