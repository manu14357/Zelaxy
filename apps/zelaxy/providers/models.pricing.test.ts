import { describe, expect, it } from 'vitest'
import { BASE_EXECUTION_CHARGE } from '@/lib/billing/constants'
import {
  creditsToDollars,
  DEFAULT_CHAT_MODEL,
  DEFAULT_FAST_MODEL,
  DEFAULT_VISION_MODEL,
  DOLLARS_PER_CREDIT,
  dollarsToCredits,
  getModelPricing,
  isKnownModel,
} from '@/providers/models'
import { calculateCost } from '@/providers/utils'

describe('latest models are registered with pricing (cost calc works)', () => {
  const expected: Record<string, { input: number; output: number }> = {
    'claude-fable-5': { input: 10, output: 50 },
    'claude-sonnet-5': { input: 3, output: 15 },
    'claude-opus-4-8': { input: 5, output: 25 },
    'claude-opus-4-5': { input: 5, output: 25 },
    'claude-opus-4-1': { input: 15, output: 75 },
    'claude-sonnet-4-5': { input: 3, output: 15 },
    'gpt-5.6-terra': { input: 2.5, output: 15 },
    'gpt-5.5': { input: 5, output: 30 },
    'gpt-5.1': { input: 1.25, output: 10 },
    'gemini-3.1-pro-preview': { input: 2, output: 12 },
    'gemini-3.5-flash': { input: 1.5, output: 9 },
    'deepseek-v4-flash': { input: 0.14, output: 0.28 },
    'grok-4.3': { input: 1.25, output: 2.5 },
  }

  for (const [model, price] of Object.entries(expected)) {
    it(`${model} has correct pricing`, () => {
      const pricing = getModelPricing(model)
      expect(pricing).not.toBeNull()
      expect(pricing?.input).toBe(price.input)
      expect(pricing?.output).toBe(price.output)
    })
  }

  it('calculateCost(claude-opus-4-8) computes from tokens (no markup in tests)', () => {
    // 1M input + 1M output → $5 + $25 = $30
    const cost = calculateCost('claude-opus-4-8', 1_000_000, 1_000_000, false, 1)
    expect(cost.input).toBeCloseTo(5, 5)
    expect(cost.output).toBeCloseTo(25, 5)
    expect(cost.total).toBeCloseTo(30, 5)
  })

  it('unknown models are flagged by isKnownModel', () => {
    expect(isKnownModel('claude-opus-4-8')).toBe(true)
    expect(isKnownModel('claude-3-haiku-20240307')).toBe(false) // the old fake Agie model
    expect(isKnownModel('totally-made-up')).toBe(false)
  })
})

describe('centralized defaults are real models', () => {
  it('DEFAULT_CHAT_MODEL / DEFAULT_FAST_MODEL / DEFAULT_VISION_MODEL resolve to pricing', () => {
    expect(isKnownModel(DEFAULT_CHAT_MODEL)).toBe(true)
    expect(isKnownModel(DEFAULT_FAST_MODEL)).toBe(true)
    expect(isKnownModel(DEFAULT_VISION_MODEL)).toBe(true)
  })
})

describe('credits', () => {
  it('1 credit = $0.005', () => {
    expect(DOLLARS_PER_CREDIT).toBe(0.005)
    expect(creditsToDollars(1)).toBe(0.005)
    expect(dollarsToCredits(0.005)).toBe(1)
    expect(dollarsToCredits(1)).toBe(200) // the docs' "× 200" conversion
  })

  it('base run charge is 1 credit', () => {
    expect(BASE_EXECUTION_CHARGE).toBe(0.005)
    expect(dollarsToCredits(BASE_EXECUTION_CHARGE)).toBe(1)
  })
})
