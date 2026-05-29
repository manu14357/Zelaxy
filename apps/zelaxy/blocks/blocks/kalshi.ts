import type { SVGProps } from 'react'
import { createElement } from 'react'
import { TrendingUp } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const KalshiIcon = (props: SVGProps<SVGSVGElement>) => createElement(TrendingUp, props)

const AUTH_OPS = [
  'get_balance',
  'get_positions',
  'get_orders',
  'get_order',
  'get_fills',
  'create_order',
  'cancel_order',
  'amend_order',
]

const TICKER_CANDLESTICKS_OPS = ['get_candlesticks']

export const KalshiBlock: BlockConfig = {
  type: 'kalshi',
  name: 'Kalshi',
  description: 'Trade and query prediction markets on Kalshi',
  longDescription:
    'Access Kalshi prediction markets. Browse markets and events, check balances, manage orders, view positions, retrieve orderbooks, and get candlestick data.',
  docsLink: 'https://docs.zelaxy.ai/tools/kalshi',
  category: 'tools',
  hideFromToolbar: true,
  bgColor: '#09C285',
  icon: KalshiIcon,
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
        { label: 'Get Balance', id: 'get_balance' },
        { label: 'Get Positions', id: 'get_positions' },
        { label: 'Get Orders', id: 'get_orders' },
        { label: 'Get Order', id: 'get_order' },
        { label: 'Get Orderbook', id: 'get_orderbook' },
        { label: 'Get Trades', id: 'get_trades' },
        { label: 'Get Candlesticks', id: 'get_candlesticks' },
        { label: 'Get Fills', id: 'get_fills' },
        { label: 'Get Series by Ticker', id: 'get_series_by_ticker' },
        { label: 'Get Exchange Status', id: 'get_exchange_status' },
        { label: 'Create Order', id: 'create_order' },
        { label: 'Cancel Order', id: 'cancel_order' },
        { label: 'Amend Order', id: 'amend_order' },
      ],
      value: () => 'get_markets',
    },
    {
      id: 'keyId',
      title: 'Key ID',
      type: 'short-input',
      placeholder: 'Your Kalshi API Key ID',
      required: true,
      condition: { field: 'operation', value: AUTH_OPS },
    },
    {
      id: 'privateKey',
      title: 'Private Key',
      type: 'long-input',
      placeholder: '-----BEGIN RSA PRIVATE KEY-----\n...',
      required: true,
      password: true,
      condition: { field: 'operation', value: AUTH_OPS },
    },
    {
      id: 'status',
      title: 'Status',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Open', id: 'open' },
        { label: 'Closed', id: 'closed' },
        { label: 'Settled', id: 'settled' },
      ],
      value: () => '',
      condition: { field: 'operation', value: ['get_markets', 'get_events'] },
      mode: 'advanced',
    },
    {
      id: 'seriesTicker',
      title: 'Series Ticker',
      type: 'short-input',
      placeholder: 'Filter by series ticker',
      condition: { field: 'operation', value: ['get_markets', 'get_events'] },
      mode: 'advanced',
    },
    {
      id: 'eventTicker',
      title: 'Event Ticker',
      type: 'short-input',
      placeholder: 'Filter by event ticker',
      condition: {
        field: 'operation',
        value: ['get_markets', 'get_event', 'get_positions', 'get_orders'],
      },
    },
    {
      id: 'ticker',
      title: 'Ticker',
      type: 'short-input',
      placeholder: 'Market ticker symbol',
      required: true,
      condition: { field: 'operation', value: ['get_market', 'get_orderbook'] },
    },
    {
      id: 'tickerFilter',
      title: 'Ticker Filter',
      type: 'short-input',
      placeholder: 'Filter by ticker',
      condition: { field: 'operation', value: ['get_orders', 'get_positions'] },
      mode: 'advanced',
    },
    {
      id: 'withNestedMarkets',
      title: 'Include Nested Markets',
      type: 'switch',
      condition: { field: 'operation', value: ['get_events', 'get_event'] },
      mode: 'advanced',
    },
    {
      id: 'settlementStatus',
      title: 'Settlement Status',
      type: 'short-input',
      placeholder: 'e.g. settled, unsettled',
      condition: { field: 'operation', value: 'get_positions' },
      mode: 'advanced',
    },
    {
      id: 'orderStatus',
      title: 'Order Status',
      type: 'dropdown',
      options: [
        { label: 'All', id: '' },
        { label: 'Resting', id: 'resting' },
        { label: 'Canceled', id: 'canceled' },
        { label: 'Executed', id: 'executed' },
        { label: 'Pending', id: 'pending' },
      ],
      value: () => '',
      condition: { field: 'operation', value: 'get_orders' },
      mode: 'advanced',
    },
    {
      id: 'minTs',
      title: 'Min Timestamp',
      type: 'short-input',
      placeholder: 'Unix timestamp',
      condition: { field: 'operation', value: 'get_fills' },
      mode: 'advanced',
    },
    {
      id: 'maxTs',
      title: 'Max Timestamp',
      type: 'short-input',
      placeholder: 'Unix timestamp',
      condition: { field: 'operation', value: 'get_fills' },
      mode: 'advanced',
    },
    {
      id: 'seriesTickerCandlesticks',
      title: 'Series Ticker',
      type: 'short-input',
      placeholder: 'Series ticker for candlesticks',
      required: true,
      condition: { field: 'operation', value: TICKER_CANDLESTICKS_OPS },
    },
    {
      id: 'tickerCandlesticks',
      title: 'Market Ticker',
      type: 'short-input',
      placeholder: 'Market ticker for candlesticks',
      required: true,
      condition: { field: 'operation', value: TICKER_CANDLESTICKS_OPS },
    },
    {
      id: 'startTs',
      title: 'Start Timestamp',
      type: 'short-input',
      placeholder: 'Unix timestamp (seconds)',
      required: true,
      condition: { field: 'operation', value: TICKER_CANDLESTICKS_OPS },
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
      placeholder: 'Unix timestamp (seconds)',
      required: true,
      condition: { field: 'operation', value: TICKER_CANDLESTICKS_OPS },
      wandConfig: {
        enabled: true,
        prompt: 'Generate a Unix timestamp in seconds. Return ONLY the number.',
        placeholder: 'Describe the end time...',
      },
    },
    {
      id: 'periodInterval',
      title: 'Period Interval',
      type: 'dropdown',
      options: [
        { label: '1 Minute', id: '1' },
        { label: '1 Hour', id: '60' },
        { label: '1 Day', id: '1440' },
      ],
      required: true,
      condition: { field: 'operation', value: TICKER_CANDLESTICKS_OPS },
    },
    {
      id: 'tickerFills',
      title: 'Ticker Filter',
      type: 'short-input',
      placeholder: 'Filter fills by ticker',
      condition: { field: 'operation', value: 'get_fills' },
      mode: 'advanced',
    },
    {
      id: 'orderId',
      title: 'Order ID',
      type: 'short-input',
      placeholder: 'Filter fills by order ID',
      condition: { field: 'operation', value: 'get_fills' },
      mode: 'advanced',
    },
    {
      id: 'seriesTickerGet',
      title: 'Series Ticker',
      type: 'short-input',
      placeholder: 'Series ticker symbol',
      required: true,
      condition: { field: 'operation', value: 'get_series_by_ticker' },
    },
    {
      id: 'orderIdParam',
      title: 'Order ID',
      type: 'short-input',
      placeholder: 'Order UUID',
      required: true,
      condition: { field: 'operation', value: ['get_order', 'cancel_order', 'amend_order'] },
    },
    {
      id: 'tickerOrder',
      title: 'Market Ticker',
      type: 'short-input',
      placeholder: 'Market ticker for order',
      required: true,
      condition: { field: 'operation', value: ['create_order', 'amend_order'] },
    },
    {
      id: 'side',
      title: 'Side',
      type: 'dropdown',
      options: [
        { label: 'Yes', id: 'yes' },
        { label: 'No', id: 'no' },
      ],
      required: true,
      condition: { field: 'operation', value: ['create_order', 'amend_order'] },
    },
    {
      id: 'action',
      title: 'Action',
      type: 'dropdown',
      options: [
        { label: 'Buy', id: 'buy' },
        { label: 'Sell', id: 'sell' },
      ],
      required: true,
      condition: { field: 'operation', value: ['create_order', 'amend_order'] },
    },
    {
      id: 'count',
      title: 'Quantity',
      type: 'short-input',
      placeholder: 'Number of contracts',
      condition: { field: 'operation', value: 'create_order' },
    },
    {
      id: 'countFp',
      title: 'Fill Quantity',
      type: 'short-input',
      placeholder: 'Fill quantity for partial fills',
      condition: { field: 'operation', value: 'create_order' },
      mode: 'advanced',
    },
    {
      id: 'countAmend',
      title: 'New Quantity',
      type: 'short-input',
      placeholder: 'New contract count',
      condition: { field: 'operation', value: 'amend_order' },
    },
    {
      id: 'orderType',
      title: 'Order Type',
      type: 'dropdown',
      options: [
        { label: 'Limit', id: 'limit' },
        { label: 'Market', id: 'market' },
      ],
      condition: { field: 'operation', value: 'create_order' },
    },
    {
      id: 'yesPrice',
      title: 'Yes Price (cents)',
      type: 'short-input',
      placeholder: '1-99',
      condition: { field: 'operation', value: ['create_order', 'amend_order'] },
    },
    {
      id: 'noPrice',
      title: 'No Price (cents)',
      type: 'short-input',
      placeholder: '1-99',
      condition: { field: 'operation', value: ['create_order', 'amend_order'] },
    },
    {
      id: 'clientOrderId',
      title: 'Client Order ID',
      type: 'short-input',
      placeholder: 'Custom order identifier (optional)',
      condition: { field: 'operation', value: 'create_order' },
      mode: 'advanced',
    },
    {
      id: 'clientOrderIdAmend',
      title: 'Client Order ID',
      type: 'short-input',
      placeholder: 'Original client order ID',
      required: true,
      condition: { field: 'operation', value: 'amend_order' },
    },
    {
      id: 'updatedClientOrderId',
      title: 'New Client Order ID',
      type: 'short-input',
      placeholder: 'New client order ID',
      required: true,
      condition: { field: 'operation', value: 'amend_order' },
    },
    {
      id: 'timeInForce',
      title: 'Time in Force',
      type: 'dropdown',
      options: [
        { label: 'Good Till Canceled', id: 'good_till_canceled' },
        { label: 'Fill or Kill', id: 'fill_or_kill' },
        { label: 'Immediate or Cancel', id: 'immediate_or_cancel' },
      ],
      condition: { field: 'operation', value: 'create_order' },
      mode: 'advanced',
    },
    {
      id: 'expirationTs',
      title: 'Expiration',
      type: 'short-input',
      placeholder: 'Unix timestamp for order expiration',
      condition: { field: 'operation', value: 'create_order' },
      mode: 'advanced',
      wandConfig: {
        enabled: true,
        prompt: 'Generate a Unix timestamp in seconds for order expiration. Return ONLY the number.',
        placeholder: 'Describe when the order should expire...',
      },
    },
    {
      id: 'postOnly',
      title: 'Post Only',
      type: 'dropdown',
      options: [
        { label: 'No', id: '' },
        { label: 'Yes', id: 'true' },
      ],
      condition: { field: 'operation', value: 'create_order' },
      mode: 'advanced',
    },
    {
      id: 'reduceOnly',
      title: 'Reduce Only',
      type: 'dropdown',
      options: [
        { label: 'No', id: '' },
        { label: 'Yes', id: 'true' },
      ],
      condition: { field: 'operation', value: 'create_order' },
      mode: 'advanced',
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      placeholder: '1-1000 (default: 100)',
      condition: {
        field: 'operation',
        value: ['get_markets', 'get_events', 'get_positions', 'get_orders', 'get_trades', 'get_fills'],
      },
      mode: 'advanced',
    },
    {
      id: 'cursor',
      title: 'Cursor',
      type: 'short-input',
      placeholder: 'Pagination cursor',
      condition: {
        field: 'operation',
        value: ['get_markets', 'get_events', 'get_positions', 'get_orders', 'get_trades', 'get_fills'],
      },
      mode: 'advanced',
    },
  ],
  tools: {
    access: [
      'kalshi_get_markets',
      'kalshi_get_market',
      'kalshi_get_events',
      'kalshi_get_event',
      'kalshi_get_balance',
      'kalshi_get_positions',
      'kalshi_get_orders',
      'kalshi_get_order',
      'kalshi_get_orderbook',
      'kalshi_get_trades',
      'kalshi_get_candlesticks',
      'kalshi_get_fills',
      'kalshi_get_series_by_ticker',
      'kalshi_get_exchange_status',
      'kalshi_create_order',
      'kalshi_cancel_order',
      'kalshi_amend_order',
    ],
    config: {
      tool: (params) => {
        switch (params.operation) {
          case 'get_markets': return 'kalshi_get_markets'
          case 'get_market': return 'kalshi_get_market'
          case 'get_events': return 'kalshi_get_events'
          case 'get_event': return 'kalshi_get_event'
          case 'get_balance': return 'kalshi_get_balance'
          case 'get_positions': return 'kalshi_get_positions'
          case 'get_orders': return 'kalshi_get_orders'
          case 'get_order': return 'kalshi_get_order'
          case 'get_orderbook': return 'kalshi_get_orderbook'
          case 'get_trades': return 'kalshi_get_trades'
          case 'get_candlesticks': return 'kalshi_get_candlesticks'
          case 'get_fills': return 'kalshi_get_fills'
          case 'get_series_by_ticker': return 'kalshi_get_series_by_ticker'
          case 'get_exchange_status': return 'kalshi_get_exchange_status'
          case 'create_order': return 'kalshi_create_order'
          case 'cancel_order': return 'kalshi_cancel_order'
          case 'amend_order': return 'kalshi_amend_order'
          default: return 'kalshi_get_markets'
        }
      },
      params: (params) => {
        const {
          operation,
          orderStatus,
          tickerFilter,
          tickerFills,
          tickerCandlesticks,
          seriesTickerCandlesticks,
          seriesTickerGet,
          orderIdParam,
          tickerOrder,
          orderType,
          countAmend,
          clientOrderIdAmend,
          ...rest
        } = params
        const cleanParams: Record<string, unknown> = {}

        if (operation === 'get_orders' && orderStatus) cleanParams.status = orderStatus
        if ((operation === 'get_orders' || operation === 'get_positions') && tickerFilter) cleanParams.ticker = tickerFilter
        if (operation === 'get_fills' && tickerFills) cleanParams.ticker = tickerFills
        if (operation === 'get_candlesticks') {
          if (seriesTickerCandlesticks) cleanParams.seriesTicker = seriesTickerCandlesticks
          if (tickerCandlesticks) cleanParams.ticker = tickerCandlesticks
        }
        if (operation === 'get_series_by_ticker' && seriesTickerGet) cleanParams.seriesTicker = seriesTickerGet
        if (['get_order', 'cancel_order', 'amend_order'].includes(operation as string) && orderIdParam) cleanParams.orderId = orderIdParam
        if (['create_order', 'amend_order'].includes(operation as string) && tickerOrder) cleanParams.ticker = tickerOrder
        if (operation === 'create_order' && orderType) cleanParams.type = orderType
        if (operation === 'amend_order' && countAmend) cleanParams.count = countAmend
        if (operation === 'amend_order' && clientOrderIdAmend) cleanParams.clientOrderId = clientOrderIdAmend

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
    keyId: { type: 'string', description: 'Kalshi API Key ID' },
    privateKey: { type: 'string', description: 'RSA Private Key (PEM format)' },
    ticker: { type: 'string', description: 'Market ticker' },
    eventTicker: { type: 'string', description: 'Event ticker' },
    status: { type: 'string', description: 'Filter by status' },
  },
  outputs: {
    markets: { type: 'json', description: 'Array of market objects' },
    events: { type: 'json', description: 'Array of event objects' },
    orders: { type: 'json', description: 'Array of order objects' },
    positions: { type: 'json', description: 'Array of position objects' },
    fills: { type: 'json', description: 'Array of fill objects' },
    trades: { type: 'json', description: 'Array of trade objects' },
    candlesticks: { type: 'json', description: 'Array of candlestick data' },
    market: { type: 'json', description: 'Single market object' },
    event: { type: 'json', description: 'Single event object' },
    order: { type: 'json', description: 'Single order object' },
    series: { type: 'json', description: 'Series object' },
    balance: { type: 'number', description: 'Account balance in cents' },
    orderbook: { type: 'json', description: 'Orderbook with bids/asks' },
    exchangeStatus: { type: 'json', description: 'Exchange status' },
    cursor: { type: 'string', description: 'Pagination cursor' },
  },
}
