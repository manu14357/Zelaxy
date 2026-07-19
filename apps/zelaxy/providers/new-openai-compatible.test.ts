/**
 * Registration + routing for the OpenAI-compatible providers added in P2.1 (zai, sakana, meta).
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getProviderDefaultModel, getProviderModels } from '@/providers/models'
import { getProvider, getProviderFromModel } from '@/providers/utils'

describe('P2.1 OpenAI-compatible providers', () => {
  const cases = [
    { id: 'zai', name: 'Z.ai', defaultModel: 'glm-4.6', model: 'glm-4.6' },
    { id: 'sakana', name: 'Sakana AI', defaultModel: 'fugu', model: 'fugu' },
    { id: 'meta', name: 'Meta', defaultModel: 'muse-spark-1.1', model: 'muse-spark-1.1' },
  ] as const

  for (const c of cases) {
    it(`${c.id} is registered with an executeRequest and a non-empty catalog`, () => {
      const provider = getProvider(c.id)
      expect(provider).toBeDefined()
      expect(provider?.name).toBe(c.name)
      expect(typeof provider?.executeRequest).toBe('function')

      const models = getProviderModels(c.id)
      expect(models.length).toBeGreaterThan(0)
      expect(models).toContain(c.model)
      expect(getProviderDefaultModel(c.id)).toBe(c.defaultModel)
    })

    it(`routes ${c.model} to the ${c.id} provider`, () => {
      expect(getProviderFromModel(c.model)).toBe(c.id)
    })
  }
})
