import type { ToolConfig } from '@/tools/types'

const GAMMA_URL = 'https://gamma-api.polymarket.com'
const CLOB_URL = 'https://clob.polymarket.com'
const DATA_URL = 'https://data-api.polymarket.com'

function handleError(data: any, status: number, op: string): never {
  throw new Error(
    `Polymarket ${op} failed: ${data?.error?.message || data?.message || data?.detail || status}`
  )
}

// ─── Gamma API (markets, events, series) ─────────────────────────────────────

export const polymarketGetMarketsTool: ToolConfig = {
  id: 'polymarket_get_markets',
  name: 'Get Markets from Polymarket',
  description: 'Retrieve a list of prediction markets from Polymarket with optional filtering',
  version: '1.0.0',
  params: {
    closed: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by closed status (true/false)',
    },
    order: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field (e.g., volumeNum, liquidityNum, startDate, endDate)',
    },
    ascending: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (true for ascending, false for descending)',
    },
    tagId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by tag ID',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max: 50)',
    },
    offset: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.closed) q.append('closed', params.closed)
      if (params.order) q.append('order', params.order)
      if (params.ascending) q.append('ascending', params.ascending)
      if (params.tagId) q.append('tag_id', params.tagId)
      q.append('limit', params.limit || '50')
      if (params.offset) q.append('offset', params.offset)
      return `${GAMMA_URL}/markets?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_markets')
    return { success: true, output: { markets: Array.isArray(data) ? data : [] } }
  },
  outputs: {
    markets: { type: 'json', description: 'Array of market objects' },
  },
}

export const polymarketGetMarketTool: ToolConfig = {
  id: 'polymarket_get_market',
  name: 'Get Market from Polymarket',
  description: 'Retrieve details of a specific prediction market by ID or slug',
  version: '1.0.0',
  params: {
    marketId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The market condition ID. Required if slug is not provided.',
    },
    slug: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The market slug (e.g., "will-trump-win"). Required if marketId is not provided.',
    },
  },
  request: {
    url: (params: any) => {
      if (params.slug) return `${GAMMA_URL}/markets/slug/${params.slug}`
      return `${GAMMA_URL}/markets/${params.marketId}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_market')
    return { success: true, output: { market: data } }
  },
  outputs: {
    market: { type: 'json', description: 'Market object with details' },
  },
}

export const polymarketGetEventsTool: ToolConfig = {
  id: 'polymarket_get_events',
  name: 'Get Events from Polymarket',
  description: 'Retrieve a list of events from Polymarket with optional filtering',
  version: '1.0.0',
  params: {
    closed: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by closed status (true/false)',
    },
    order: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field (e.g., volume, liquidity, startDate, endDate)',
    },
    ascending: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (true for ascending, false for descending)',
    },
    tagId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by tag ID',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max: 50)',
    },
    offset: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.closed) q.append('closed', params.closed)
      if (params.order) q.append('order', params.order)
      if (params.ascending) q.append('ascending', params.ascending)
      if (params.tagId) q.append('tag_id', params.tagId)
      q.append('limit', params.limit || '50')
      if (params.offset) q.append('offset', params.offset)
      return `${GAMMA_URL}/events?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_events')
    return { success: true, output: { events: Array.isArray(data) ? data : [] } }
  },
  outputs: {
    events: { type: 'json', description: 'Array of event objects' },
  },
}

export const polymarketGetEventTool: ToolConfig = {
  id: 'polymarket_get_event',
  name: 'Get Event from Polymarket',
  description: 'Retrieve details of a specific Polymarket event by ID or slug',
  version: '1.0.0',
  params: {
    eventId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The event ID. Required if slug is not provided.',
    },
    slug: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'The event slug. Required if eventId is not provided.',
    },
  },
  request: {
    url: (params: any) => {
      if (params.slug) return `${GAMMA_URL}/events/slug/${params.slug}`
      return `${GAMMA_URL}/events/${params.eventId}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_event')
    return { success: true, output: { event: data } }
  },
  outputs: {
    event: { type: 'json', description: 'Event object with details' },
  },
}

export const polymarketGetSeriesTool: ToolConfig = {
  id: 'polymarket_get_series',
  name: 'Get Series from Polymarket',
  description: 'Retrieve series (related market groups) from Polymarket',
  version: '1.0.0',
  params: {
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max: 50)',
    },
    offset: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      q.append('limit', params.limit || '50')
      if (params.offset) q.append('offset', params.offset)
      return `${GAMMA_URL}/series?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_series')
    const series = Array.isArray(data)
      ? data.map((s: any) => ({
          id: s.id,
          ticker: s.ticker,
          slug: s.slug,
          title: s.title,
          seriesType: s.seriesType,
          recurrence: s.recurrence,
          image: s.image,
          icon: s.icon,
          active: s.active,
          closed: s.closed,
          archived: s.archived,
          featured: s.featured,
          volume: s.volume,
          liquidity: s.liquidity,
        }))
      : []
    return { success: true, output: { series } }
  },
  outputs: {
    series: { type: 'json', description: 'Array of series objects' },
  },
}

export const polymarketGetSeriesByIdTool: ToolConfig = {
  id: 'polymarket_get_series_by_id',
  name: 'Get Series by ID from Polymarket',
  description: 'Retrieve a specific series (related market group) by ID from Polymarket',
  version: '1.0.0',
  params: {
    seriesId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The series ID',
    },
  },
  request: {
    url: (params: any) => `${GAMMA_URL}/series/${params.seriesId}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_series_by_id')
    return { success: true, output: { series: data } }
  },
  outputs: {
    series: { type: 'json', description: 'Series object with details' },
  },
}

export const polymarketGetTagsTool: ToolConfig = {
  id: 'polymarket_get_tags',
  name: 'Get Tags from Polymarket',
  description: 'Retrieve available tags for filtering markets from Polymarket',
  version: '1.0.0',
  params: {
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max: 50)',
    },
    offset: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      q.append('limit', params.limit || '50')
      if (params.offset) q.append('offset', params.offset)
      return `${GAMMA_URL}/tags?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_tags')
    return { success: true, output: { tags: Array.isArray(data) ? data : [] } }
  },
  outputs: {
    tags: { type: 'json', description: 'Array of tag objects' },
  },
}

export const polymarketSearchTool: ToolConfig = {
  id: 'polymarket_search',
  name: 'Search Polymarket',
  description: 'Search for markets, events, and profiles on Polymarket',
  version: '1.0.0',
  params: {
    query: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Search query term (e.g., "presidential election", "bitcoin price")',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (max: 50)',
    },
    page: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Page number for pagination (1-indexed)',
    },
    eventsStatus: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter events by status',
    },
    sort: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field',
    },
    ascending: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (true for ascending, false for descending)',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      q.append('q', params.query)
      q.append('limit', params.limit || '50')
      if (params.page) q.append('page', params.page)
      if (params.eventsStatus) q.append('events_status', params.eventsStatus)
      if (params.sort) q.append('sort', params.sort)
      if (params.ascending) q.append('ascending', params.ascending)
      return `${GAMMA_URL}/public-search?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'search')
    return {
      success: true,
      output: {
        markets: data.markets || [],
        events: data.events || [],
        profiles: data.profiles || [],
      },
    }
  },
  outputs: {
    markets: { type: 'json', description: 'Matching markets' },
    events: { type: 'json', description: 'Matching events' },
    profiles: { type: 'json', description: 'Matching profiles' },
  },
}

// ─── CLOB API (prices, orderbook) ────────────────────────────────────────────

export const polymarketGetOrderbookTool: ToolConfig = {
  id: 'polymarket_get_orderbook',
  name: 'Get Orderbook from Polymarket',
  description: 'Retrieve the order book for a specific token',
  version: '1.0.0',
  params: {
    tokenId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The CLOB token ID from market clobTokenIds array',
    },
  },
  request: {
    url: (params: any) => `${CLOB_URL}/book?token_id=${encodeURIComponent(params.tokenId)}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_orderbook')
    return {
      success: true,
      output: {
        orderbook: {
          market: data.market ?? '',
          asset_id: data.asset_id ?? '',
          hash: data.hash ?? '',
          timestamp: data.timestamp ?? '',
          bids: data.bids ?? [],
          asks: data.asks ?? [],
          min_order_size: data.min_order_size ?? '0',
          tick_size: data.tick_size ?? '0',
        },
      },
    }
  },
  outputs: {
    orderbook: { type: 'json', description: 'Order book with bids and asks arrays' },
  },
}

export const polymarketGetPriceTool: ToolConfig = {
  id: 'polymarket_get_price',
  name: 'Get Price from Polymarket',
  description: 'Retrieve the market price for a specific token and side',
  version: '1.0.0',
  params: {
    tokenId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The CLOB token ID from market clobTokenIds array',
    },
    side: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Order side: "buy" or "sell"',
    },
  },
  request: {
    url: (params: any) =>
      `${CLOB_URL}/price?token_id=${encodeURIComponent(params.tokenId)}&side=${params.side.toUpperCase()}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_price')
    return { success: true, output: { price: data.price || data } }
  },
  outputs: {
    price: { type: 'string', description: 'Market price' },
  },
}

export const polymarketGetMidpointTool: ToolConfig = {
  id: 'polymarket_get_midpoint',
  name: 'Get Midpoint Price from Polymarket',
  description: 'Retrieve the midpoint price for a specific token',
  version: '1.0.0',
  params: {
    tokenId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The CLOB token ID from market clobTokenIds array',
    },
  },
  request: {
    url: (params: any) => `${CLOB_URL}/midpoint?token_id=${encodeURIComponent(params.tokenId)}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_midpoint')
    return { success: true, output: { midpoint: data.mid || data.midpoint || data } }
  },
  outputs: {
    midpoint: { type: 'string', description: 'Midpoint price' },
  },
}

export const polymarketGetSpreadTool: ToolConfig = {
  id: 'polymarket_get_spread',
  name: 'Get Spread from Polymarket',
  description: 'Retrieve the bid-ask spread for a specific token',
  version: '1.0.0',
  params: {
    tokenId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The CLOB token ID from market clobTokenIds array',
    },
  },
  request: {
    url: (params: any) => `${CLOB_URL}/spread?token_id=${encodeURIComponent(params.tokenId)}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_spread')
    return { success: true, output: { spread: data.spread ?? '' } }
  },
  outputs: {
    spread: { type: 'string', description: 'Bid-ask spread value' },
  },
}

export const polymarketGetTickSizeTool: ToolConfig = {
  id: 'polymarket_get_tick_size',
  name: 'Get Tick Size from Polymarket',
  description: 'Retrieve the minimum tick size for a specific token',
  version: '1.0.0',
  params: {
    tokenId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The CLOB token ID from market clobTokenIds array',
    },
  },
  request: {
    url: (params: any) => `${CLOB_URL}/tick-size?token_id=${encodeURIComponent(params.tokenId)}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_tick_size')
    return { success: true, output: { tickSize: data.minimum_tick_size || data.tick_size || '' } }
  },
  outputs: {
    tickSize: { type: 'string', description: 'Minimum tick size' },
  },
}

export const polymarketGetLastTradePriceTool: ToolConfig = {
  id: 'polymarket_get_last_trade_price',
  name: 'Get Last Trade Price from Polymarket',
  description: 'Retrieve the last trade price for a specific token',
  version: '1.0.0',
  params: {
    tokenId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The CLOB token ID from market clobTokenIds array',
    },
  },
  request: {
    url: (params: any) =>
      `${CLOB_URL}/last-trade-price?token_id=${encodeURIComponent(params.tokenId)}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_last_trade_price')
    return { success: true, output: { price: data.price ?? '', side: data.side ?? '' } }
  },
  outputs: {
    price: { type: 'string', description: 'Last trade price' },
    side: { type: 'string', description: 'Side of the last trade (BUY or SELL)' },
  },
}

export const polymarketGetPriceHistoryTool: ToolConfig = {
  id: 'polymarket_get_price_history',
  name: 'Get Price History from Polymarket',
  description: 'Retrieve historical price data for a specific market token',
  version: '1.0.0',
  params: {
    tokenId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The CLOB token ID from market clobTokenIds array',
    },
    interval: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration ending at current time (1m, 1h, 6h, 1d, 1w, max)',
    },
    fidelity: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Data resolution in minutes (e.g., 60 for hourly)',
    },
    startTs: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Start timestamp (Unix seconds UTC)',
    },
    endTs: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'End timestamp (Unix seconds UTC)',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      q.append('market', params.tokenId)
      if (params.interval) q.append('interval', params.interval)
      if (params.fidelity != null) q.append('fidelity', String(params.fidelity))
      if (params.startTs != null) q.append('startTs', String(params.startTs))
      if (params.endTs != null) q.append('endTs', String(params.endTs))
      return `${CLOB_URL}/prices-history?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_price_history')
    return {
      success: true,
      output: { history: data.history || (Array.isArray(data) ? data : []) },
    }
  },
  outputs: {
    history: { type: 'json', description: 'Array of historical price entries [{t, p}]' },
  },
}

// ─── Data API (activity, positions, trades, leaderboard, holders) ─────────────

export const polymarketGetPositionsTool: ToolConfig = {
  id: 'polymarket_get_positions',
  name: 'Get Positions from Polymarket',
  description: 'Retrieve user positions from Polymarket',
  version: '1.0.0',
  params: {
    user: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'User wallet address',
    },
    market: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Condition IDs to filter positions (comma-separated)',
    },
    eventId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event ID to filter positions',
    },
    sizeThreshold: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Minimum position size threshold (default: 1)',
    },
    sortBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field',
    },
    sortDirection: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction (ASC or DESC)',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page',
    },
    offset: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      q.append('user', params.user)
      if (params.market) q.append('market', params.market)
      if (params.eventId) q.append('eventId', params.eventId)
      if (params.sizeThreshold) q.append('sizeThreshold', params.sizeThreshold)
      if (params.sortBy) q.append('sortBy', params.sortBy)
      if (params.sortDirection) q.append('sortDirection', params.sortDirection)
      if (params.limit) q.append('limit', params.limit)
      if (params.offset) q.append('offset', params.offset)
      return `${DATA_URL}/positions?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_positions')
    return { success: true, output: { positions: Array.isArray(data) ? data : [] } }
  },
  outputs: {
    positions: { type: 'json', description: 'Array of position objects' },
  },
}

export const polymarketGetTradesTool: ToolConfig = {
  id: 'polymarket_get_trades',
  name: 'Get Trades from Polymarket',
  description: 'Retrieve trade history from Polymarket',
  version: '1.0.0',
  params: {
    user: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'User wallet address to filter trades',
    },
    market: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Market/condition ID to filter trades',
    },
    eventId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Event ID to filter trades',
    },
    side: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Trade direction filter (BUY or SELL)',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results per page (default: 100, max: 10000)',
    },
    offset: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.user) q.append('user', params.user)
      if (params.market) q.append('market', params.market)
      if (params.eventId) q.append('eventId', params.eventId)
      if (params.side) q.append('side', params.side.toUpperCase())
      if (params.limit) q.append('limit', params.limit)
      if (params.offset) q.append('offset', params.offset)
      return `${DATA_URL}/trades?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_trades')
    return { success: true, output: { trades: Array.isArray(data) ? data : [] } }
  },
  outputs: {
    trades: { type: 'json', description: 'Array of trade objects' },
  },
}

export const polymarketGetActivityTool: ToolConfig = {
  id: 'polymarket_get_activity',
  name: 'Get Activity from Polymarket',
  description: 'Retrieve on-chain activity for a user (trades, splits, merges, redemptions, rewards)',
  version: '1.0.0',
  params: {
    user: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'User wallet address (0x-prefixed)',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum results to return (default: 100, max: 500)',
    },
    offset: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
    market: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated condition IDs',
    },
    eventId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Comma-separated event IDs',
    },
    type: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Activity type: TRADE, SPLIT, MERGE, REDEEM, REWARD, CONVERSION, MAKER_REBATE',
    },
    start: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Start timestamp (Unix seconds)',
    },
    end: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'End timestamp (Unix seconds)',
    },
    sortBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort field: TIMESTAMP, TOKENS, or CASH (default: TIMESTAMP)',
    },
    sortDirection: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Sort direction: ASC or DESC (default: DESC)',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      q.append('user', params.user)
      if (params.limit) q.append('limit', params.limit)
      if (params.offset) q.append('offset', params.offset)
      if (params.market) q.append('market', params.market)
      if (params.eventId) q.append('eventId', params.eventId)
      if (params.type) q.append('type', params.type)
      if (params.start != null) q.append('start', String(params.start))
      if (params.end != null) q.append('end', String(params.end))
      if (params.sortBy) q.append('sortBy', params.sortBy)
      if (params.sortDirection) q.append('sortDirection', params.sortDirection)
      return `${DATA_URL}/activity?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_activity')
    return { success: true, output: { activity: Array.isArray(data) ? data : [] } }
  },
  outputs: {
    activity: { type: 'json', description: 'Array of on-chain activity objects' },
  },
}

export const polymarketGetLeaderboardTool: ToolConfig = {
  id: 'polymarket_get_leaderboard',
  name: 'Get Leaderboard from Polymarket',
  description: 'Retrieve trader leaderboard rankings by profit/loss or volume',
  version: '1.0.0',
  params: {
    category: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Category: OVERALL, POLITICS, SPORTS, CRYPTO, CULTURE, MENTIONS, WEATHER, ECONOMICS, TECH, FINANCE',
    },
    timePeriod: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Time period: DAY, WEEK, MONTH, ALL (default: DAY)',
    },
    orderBy: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Order by: PNL or VOL (default: PNL)',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (range: 1-50, default: 25)',
    },
    offset: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to skip for pagination',
    },
    user: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by specific user wallet address',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.category) q.append('category', params.category)
      if (params.timePeriod) q.append('timePeriod', params.timePeriod)
      if (params.orderBy) q.append('orderBy', params.orderBy)
      if (params.limit) q.append('limit', params.limit)
      if (params.offset) q.append('offset', params.offset)
      if (params.user) q.append('user', params.user)
      const qs = q.toString()
      return qs ? `${DATA_URL}/v1/leaderboard?${qs}` : `${DATA_URL}/v1/leaderboard`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_leaderboard')
    return { success: true, output: { leaderboard: Array.isArray(data) ? data : [] } }
  },
  outputs: {
    leaderboard: { type: 'json', description: 'Array of leaderboard entries' },
  },
}

export const polymarketGetHoldersTool: ToolConfig = {
  id: 'polymarket_get_holders',
  name: 'Get Market Holders from Polymarket',
  description: 'Retrieve top holders of a specific market token',
  version: '1.0.0',
  params: {
    market: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Comma-separated list of condition IDs',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of holders to return (range: 0-20, default: 20)',
    },
    minBalance: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Minimum balance threshold (default: 1)',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      q.append('market', params.market)
      if (params.limit) q.append('limit', params.limit)
      if (params.minBalance) q.append('minBalance', params.minBalance)
      return `${DATA_URL}/holders?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) handleError(data, response.status, 'get_holders')
    return { success: true, output: { holders: Array.isArray(data) ? data : [] } }
  },
  outputs: {
    holders: { type: 'json', description: 'Array of market holder groups by token' },
  },
}
