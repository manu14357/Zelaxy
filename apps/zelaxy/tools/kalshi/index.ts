import crypto from 'crypto'

import type { ToolConfig } from '@/tools/types'

const KALSHI_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2'

function normalizePemKey(privateKey: string): string {
  let key = privateKey.trim()
  key = key.replace(/\\n/g, '\n')

  const beginMatch = key.match(/-----BEGIN ([A-Z\s]+)-----/)
  const endMatch = key.match(/-----END ([A-Z\s]+)-----/)

  if (beginMatch && endMatch) {
    const keyType = beginMatch[1]
    const startIdx = key.indexOf('-----', key.indexOf('-----') + 5) + 5
    const endIdx = key.lastIndexOf('-----END')
    let base64Content = key.substring(startIdx, endIdx)
    base64Content = base64Content.replace(/\s/g, '')

    const lines: string[] = []
    for (let i = 0; i < base64Content.length; i += 64) {
      lines.push(base64Content.substring(i, i + 64))
    }
    return `-----BEGIN ${keyType}-----\n${lines.join('\n')}\n-----END ${keyType}-----`
  }

  const cleanKey = key.replace(/\s/g, '')
  const lines: string[] = []
  for (let i = 0; i < cleanKey.length; i += 64) {
    lines.push(cleanKey.substring(i, i + 64))
  }
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`
}

function generateKalshiSignature(
  privateKey: string,
  timestamp: string,
  method: string,
  path: string
): string {
  const pathWithoutQuery = path.split('?')[0]
  const message = timestamp + method.toUpperCase() + pathWithoutQuery
  const pemKey = normalizePemKey(privateKey)
  const signature = crypto.sign('sha256', Buffer.from(message, 'utf-8'), {
    key: pemKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  })
  return signature.toString('base64')
}

function buildKalshiAuthHeaders(
  keyId: string,
  privateKey: string,
  method: string,
  path: string
): Record<string, string> {
  const timestamp = Date.now().toString()
  const signature = generateKalshiSignature(privateKey, timestamp, method, path)
  return {
    'KALSHI-ACCESS-KEY': keyId,
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
    'KALSHI-ACCESS-SIGNATURE': signature,
    'Content-Type': 'application/json',
  }
}

// ─── Public endpoints ─────────────────────────────────────────────────────────

export const kalshiGetMarketsTool: ToolConfig = {
  id: 'kalshi_get_markets',
  name: 'Get Markets from Kalshi',
  description: 'Retrieve a list of prediction markets from Kalshi with optional filtering',
  version: '1.0.0',
  params: {
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by market status: "unopened", "open", "closed", or "settled"',
    },
    seriesTicker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by series ticker (e.g., "KXBTC", "INX")',
    },
    eventTicker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by event ticker (e.g., "KXBTC-24DEC31")',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (1-1000, default: 100)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from previous response',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.status) q.append('status', params.status)
      if (params.seriesTicker) q.append('series_ticker', params.seriesTicker)
      if (params.eventTicker) q.append('event_ticker', params.eventTicker)
      if (params.limit) q.append('limit', params.limit)
      if (params.cursor) q.append('cursor', params.cursor)
      const qs = q.toString()
      return qs ? `${KALSHI_BASE_URL}/markets?${qs}` : `${KALSHI_BASE_URL}/markets`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { markets: data.markets || [], cursor: data.cursor || null } }
  },
  outputs: {
    markets: { type: 'json', description: 'Array of market objects' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
}

export const kalshiGetMarketTool: ToolConfig = {
  id: 'kalshi_get_market',
  name: 'Get Market from Kalshi',
  description: 'Retrieve details for a specific Kalshi market by ticker',
  version: '1.0.0',
  params: {
    ticker: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Market ticker identifier (e.g., "KXBTC-24DEC31")',
    },
  },
  request: {
    url: (params: any) => `${KALSHI_BASE_URL}/markets/${params.ticker}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { market: data.market || data } }
  },
  outputs: {
    market: { type: 'json', description: 'Market object' },
  },
}

export const kalshiGetEventsTool: ToolConfig = {
  id: 'kalshi_get_events',
  name: 'Get Events from Kalshi',
  description: 'Retrieve a list of Kalshi events with optional filtering',
  version: '1.0.0',
  params: {
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by event status',
    },
    seriesTicker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by series ticker',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (1-200, default: 100)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from previous response',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.status) q.append('status', params.status)
      if (params.seriesTicker) q.append('series_ticker', params.seriesTicker)
      if (params.limit) q.append('limit', params.limit)
      if (params.cursor) q.append('cursor', params.cursor)
      const qs = q.toString()
      return qs ? `${KALSHI_BASE_URL}/events?${qs}` : `${KALSHI_BASE_URL}/events`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { events: data.events || [], cursor: data.cursor || null } }
  },
  outputs: {
    events: { type: 'json', description: 'Array of event objects' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
}

export const kalshiGetEventTool: ToolConfig = {
  id: 'kalshi_get_event',
  name: 'Get Event from Kalshi',
  description: 'Retrieve details for a specific Kalshi event by ticker',
  version: '1.0.0',
  params: {
    eventTicker: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Event ticker identifier (e.g., "KXBTC-24DEC31")',
    },
    withNestedMarkets: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Include nested markets in the response',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.withNestedMarkets) q.append('with_nested_markets', 'true')
      const qs = q.toString()
      return qs
        ? `${KALSHI_BASE_URL}/events/${params.eventTicker}?${qs}`
        : `${KALSHI_BASE_URL}/events/${params.eventTicker}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { event: data.event || data } }
  },
  outputs: {
    event: { type: 'json', description: 'Event object' },
  },
}

export const kalshiGetOrderbookTool: ToolConfig = {
  id: 'kalshi_get_orderbook',
  name: 'Get Market Orderbook from Kalshi',
  description: 'Retrieve the orderbook (yes and no bids) for a specific market',
  version: '1.0.0',
  params: {
    ticker: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Market ticker identifier (e.g., "KXBTC-24DEC31")',
    },
    depth: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of price levels to return',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.depth) q.append('depth', String(params.depth))
      const qs = q.toString()
      return qs
        ? `${KALSHI_BASE_URL}/markets/${params.ticker}/orderbook?${qs}`
        : `${KALSHI_BASE_URL}/markets/${params.ticker}/orderbook`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { orderbook: data.orderbook || { yes: [], no: [] } } }
  },
  outputs: {
    orderbook: { type: 'json', description: 'Orderbook with yes/no bids and asks' },
  },
}

export const kalshiGetTradesTool: ToolConfig = {
  id: 'kalshi_get_trades',
  name: 'Get Trades from Kalshi',
  description: 'Retrieve recent trades across Kalshi markets',
  version: '1.0.0',
  params: {
    ticker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by market ticker',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (1-1000, default: 100)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from previous response',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.ticker) q.append('ticker', params.ticker)
      if (params.limit) q.append('limit', params.limit)
      if (params.cursor) q.append('cursor', params.cursor)
      const qs = q.toString()
      return qs ? `${KALSHI_BASE_URL}/markets/trades?${qs}` : `${KALSHI_BASE_URL}/markets/trades`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { trades: data.trades || [], cursor: data.cursor || null } }
  },
  outputs: {
    trades: { type: 'json', description: 'Array of trade objects' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
}

export const kalshiGetCandlesticksTool: ToolConfig = {
  id: 'kalshi_get_candlesticks',
  name: 'Get Market Candlesticks from Kalshi',
  description: 'Retrieve OHLC candlestick data for a specific Kalshi market',
  version: '1.0.0',
  params: {
    seriesTicker: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Series ticker identifier (e.g., "KXBTC")',
    },
    ticker: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Market ticker identifier (e.g., "KXBTC-24DEC31")',
    },
    startTs: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Start timestamp in Unix seconds',
    },
    endTs: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'End timestamp in Unix seconds',
    },
    periodInterval: {
      type: 'number',
      required: true,
      visibility: 'user-or-llm',
      description: 'Period interval: 1 (1 minute), 60 (1 hour), or 1440 (1 day)',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      q.append('start_ts', String(params.startTs))
      q.append('end_ts', String(params.endTs))
      q.append('period_interval', String(params.periodInterval))
      return `${KALSHI_BASE_URL}/series/${params.seriesTicker}/markets/${params.ticker}/candlesticks?${q.toString()}`
    },
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { candlesticks: data.candlesticks || [] } }
  },
  outputs: {
    candlesticks: { type: 'json', description: 'Array of OHLC candlestick data' },
  },
}

export const kalshiGetSeriesByTickerTool: ToolConfig = {
  id: 'kalshi_get_series_by_ticker',
  name: 'Get Series by Ticker from Kalshi',
  description: 'Retrieve series details for a specific series ticker',
  version: '1.0.0',
  params: {
    seriesTicker: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Series ticker identifier (e.g., "KXBTC", "INX")',
    },
  },
  request: {
    url: (params: any) => `${KALSHI_BASE_URL}/series/${params.seriesTicker}`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { series: data.series || data } }
  },
  outputs: {
    series: { type: 'json', description: 'Series object' },
  },
}

export const kalshiGetExchangeStatusTool: ToolConfig = {
  id: 'kalshi_get_exchange_status',
  name: 'Get Exchange Status from Kalshi',
  description: 'Retrieve the current status of the Kalshi exchange',
  version: '1.0.0',
  params: {},
  request: {
    url: () => `${KALSHI_BASE_URL}/exchange/status`,
    method: 'GET',
    headers: () => ({ 'Content-Type': 'application/json' }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return {
      success: true,
      output: {
        tradingActive: data.trading_active ?? false,
        exchangeActive: data.exchange_active ?? false,
      },
    }
  },
  outputs: {
    tradingActive: { type: 'boolean', description: 'Whether trading is active' },
    exchangeActive: { type: 'boolean', description: 'Whether the exchange is active' },
  },
}

// ─── Authenticated endpoints ──────────────────────────────────────────────────

export const kalshiGetBalanceTool: ToolConfig = {
  id: 'kalshi_get_balance',
  name: 'Get Balance from Kalshi',
  description: 'Retrieve your account balance and portfolio value from Kalshi',
  version: '1.0.0',
  params: {
    keyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Kalshi API Key ID',
    },
    privateKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your RSA Private Key (PEM format)',
    },
  },
  request: {
    url: () => `${KALSHI_BASE_URL}/portfolio/balance`,
    method: 'GET',
    headers: (params: any) => buildKalshiAuthHeaders(params.keyId, params.privateKey, 'GET', '/trade-api/v2/portfolio/balance'),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { balance: data.balance ?? 0, portfolioValue: data.portfolio_value ?? 0 } }
  },
  outputs: {
    balance: { type: 'number', description: 'Account balance in cents' },
    portfolioValue: { type: 'number', description: 'Portfolio value in cents' },
  },
}

export const kalshiGetPositionsTool: ToolConfig = {
  id: 'kalshi_get_positions',
  name: 'Get Positions from Kalshi',
  description: 'Retrieve your open positions from Kalshi',
  version: '1.0.0',
  params: {
    keyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Kalshi API Key ID',
    },
    privateKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your RSA Private Key (PEM format)',
    },
    ticker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by market ticker',
    },
    eventTicker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by event ticker',
    },
    settlementStatus: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by settlement status: "all", "unsettled", or "settled"',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (1-1000, default: 100)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from previous response',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.ticker) q.append('ticker', params.ticker)
      if (params.eventTicker) q.append('event_ticker', params.eventTicker)
      if (params.settlementStatus) q.append('settlement_status', params.settlementStatus)
      if (params.limit) q.append('limit', params.limit)
      if (params.cursor) q.append('cursor', params.cursor)
      const qs = q.toString()
      return qs ? `${KALSHI_BASE_URL}/portfolio/positions?${qs}` : `${KALSHI_BASE_URL}/portfolio/positions`
    },
    method: 'GET',
    headers: (params: any) =>
      buildKalshiAuthHeaders(params.keyId, params.privateKey, 'GET', '/trade-api/v2/portfolio/positions'),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return {
      success: true,
      output: {
        positions: data.market_positions || data.positions || [],
        cursor: data.cursor || null,
      },
    }
  },
  outputs: {
    positions: { type: 'json', description: 'Array of position objects' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
}

export const kalshiGetOrdersTool: ToolConfig = {
  id: 'kalshi_get_orders',
  name: 'Get Orders from Kalshi',
  description: 'Retrieve your orders from Kalshi with optional filtering',
  version: '1.0.0',
  params: {
    keyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Kalshi API Key ID',
    },
    privateKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your RSA Private Key (PEM format)',
    },
    ticker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by market ticker',
    },
    eventTicker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by event ticker',
    },
    status: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by order status: "resting", "canceled", or "executed"',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (1-200, default: 100)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from previous response',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.ticker) q.append('ticker', params.ticker)
      if (params.eventTicker) q.append('event_ticker', params.eventTicker)
      if (params.status) q.append('status', params.status)
      if (params.limit) q.append('limit', params.limit)
      if (params.cursor) q.append('cursor', params.cursor)
      const qs = q.toString()
      return qs ? `${KALSHI_BASE_URL}/portfolio/orders?${qs}` : `${KALSHI_BASE_URL}/portfolio/orders`
    },
    method: 'GET',
    headers: (params: any) =>
      buildKalshiAuthHeaders(params.keyId, params.privateKey, 'GET', '/trade-api/v2/portfolio/orders'),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return {
      success: true,
      output: { orders: data.orders || [], cursor: data.cursor || null },
    }
  },
  outputs: {
    orders: { type: 'json', description: 'Array of order objects' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
}

export const kalshiGetOrderTool: ToolConfig = {
  id: 'kalshi_get_order',
  name: 'Get Order from Kalshi',
  description: 'Retrieve details of a specific order by ID from Kalshi',
  version: '1.0.0',
  params: {
    keyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Kalshi API Key ID',
    },
    privateKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your RSA Private Key (PEM format)',
    },
    orderId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Order ID to retrieve',
    },
  },
  request: {
    url: (params: any) => `${KALSHI_BASE_URL}/portfolio/orders/${params.orderId}`,
    method: 'GET',
    headers: (params: any) =>
      buildKalshiAuthHeaders(
        params.keyId,
        params.privateKey,
        'GET',
        `/trade-api/v2/portfolio/orders/${params.orderId}`
      ),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { order: data.order || data } }
  },
  outputs: {
    order: { type: 'json', description: 'Order object' },
  },
}

export const kalshiGetFillsTool: ToolConfig = {
  id: 'kalshi_get_fills',
  name: "Get Fills from Kalshi",
  description: "Retrieve your portfolio's fills/trades from Kalshi",
  version: '1.0.0',
  params: {
    keyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Kalshi API Key ID',
    },
    privateKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your RSA Private Key (PEM format)',
    },
    ticker: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by market ticker',
    },
    orderId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Filter by order ID',
    },
    minTs: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Minimum timestamp in Unix milliseconds',
    },
    maxTs: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Maximum timestamp in Unix milliseconds',
    },
    limit: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Number of results to return (1-1000, default: 100)',
    },
    cursor: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Pagination cursor from previous response',
    },
  },
  request: {
    url: (params: any) => {
      const q = new URLSearchParams()
      if (params.ticker) q.append('ticker', params.ticker)
      if (params.orderId) q.append('order_id', params.orderId)
      if (params.minTs != null) q.append('min_ts', String(params.minTs))
      if (params.maxTs != null) q.append('max_ts', String(params.maxTs))
      if (params.limit) q.append('limit', params.limit)
      if (params.cursor) q.append('cursor', params.cursor)
      const qs = q.toString()
      return qs ? `${KALSHI_BASE_URL}/portfolio/fills?${qs}` : `${KALSHI_BASE_URL}/portfolio/fills`
    },
    method: 'GET',
    headers: (params: any) =>
      buildKalshiAuthHeaders(params.keyId, params.privateKey, 'GET', '/trade-api/v2/portfolio/fills'),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return {
      success: true,
      output: { fills: data.fills || [], cursor: data.cursor || null },
    }
  },
  outputs: {
    fills: { type: 'json', description: 'Array of fill objects' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
}

export const kalshiCreateOrderTool: ToolConfig = {
  id: 'kalshi_create_order',
  name: 'Create Order on Kalshi',
  description: 'Create a new order on a Kalshi prediction market',
  version: '1.0.0',
  params: {
    keyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Kalshi API Key ID',
    },
    privateKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your RSA Private Key (PEM format)',
    },
    ticker: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Market ticker identifier',
    },
    side: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Side of the order: "yes" or "no"',
    },
    action: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Action type: "buy" or "sell"',
    },
    count: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Number of contracts to trade',
    },
    type: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Order type: "limit" or "market" (default: "limit")',
    },
    yesPrice: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Yes price in cents (1-99)',
    },
    noPrice: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'No price in cents (1-99)',
    },
    clientOrderId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Custom order identifier',
    },
    expirationTs: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Unix timestamp for order expiration',
    },
  },
  request: {
    url: () => `${KALSHI_BASE_URL}/portfolio/orders`,
    method: 'POST',
    headers: (params: any) =>
      buildKalshiAuthHeaders(params.keyId, params.privateKey, 'POST', '/trade-api/v2/portfolio/orders'),
    body: (params: any) => {
      const body: Record<string, any> = {
        ticker: params.ticker,
        side: params.side,
        action: params.action,
        count: parseInt(params.count, 10),
        type: params.type || 'limit',
      }
      if (params.yesPrice) body.yes_price = parseInt(params.yesPrice, 10)
      if (params.noPrice) body.no_price = parseInt(params.noPrice, 10)
      if (params.clientOrderId) body.client_order_id = params.clientOrderId
      if (params.expirationTs) body.expiration_ts = parseInt(params.expirationTs, 10)
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { order: data.order || data } }
  },
  outputs: {
    order: { type: 'json', description: 'Created order object' },
  },
}

export const kalshiCancelOrderTool: ToolConfig = {
  id: 'kalshi_cancel_order',
  name: 'Cancel Order on Kalshi',
  description: 'Cancel an existing order on Kalshi',
  version: '1.0.0',
  params: {
    keyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Kalshi API Key ID',
    },
    privateKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your RSA Private Key (PEM format)',
    },
    orderId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Order ID to cancel',
    },
  },
  request: {
    url: (params: any) => `${KALSHI_BASE_URL}/portfolio/orders/${params.orderId}`,
    method: 'DELETE',
    headers: (params: any) =>
      buildKalshiAuthHeaders(
        params.keyId,
        params.privateKey,
        'DELETE',
        `/trade-api/v2/portfolio/orders/${params.orderId}`
      ),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return {
      success: true,
      output: { order: data.order || {}, reducedBy: data.reduced_by || 0 },
    }
  },
  outputs: {
    order: { type: 'json', description: 'The canceled order object' },
    reducedBy: { type: 'number', description: 'Number of contracts canceled' },
  },
}

export const kalshiAmendOrderTool: ToolConfig = {
  id: 'kalshi_amend_order',
  name: 'Amend Order on Kalshi',
  description: 'Amend an existing order on Kalshi (change count or price)',
  version: '1.0.0',
  params: {
    keyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Kalshi API Key ID',
    },
    privateKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your RSA Private Key (PEM format)',
    },
    orderId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Order ID to amend',
    },
    count: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New number of contracts',
    },
    yesPrice: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New yes price in cents (1-99)',
    },
    noPrice: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New no price in cents (1-99)',
    },
    expirationTs: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'New Unix timestamp for order expiration',
    },
  },
  request: {
    url: (params: any) => `${KALSHI_BASE_URL}/portfolio/orders/${params.orderId}/amend`,
    method: 'POST',
    headers: (params: any) =>
      buildKalshiAuthHeaders(
        params.keyId,
        params.privateKey,
        'POST',
        `/trade-api/v2/portfolio/orders/${params.orderId}/amend`
      ),
    body: (params: any) => {
      const body: Record<string, any> = {}
      if (params.count) body.count = parseInt(params.count, 10)
      if (params.yesPrice) body.yes_price = parseInt(params.yesPrice, 10)
      if (params.noPrice) body.no_price = parseInt(params.noPrice, 10)
      if (params.expirationTs) body.expiration_ts = parseInt(params.expirationTs, 10)
      return body
    },
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || data.message || `Kalshi error: ${response.status}`)
    return { success: true, output: { order: data.order || data } }
  },
  outputs: {
    order: { type: 'json', description: 'The amended order object' },
  },
}
