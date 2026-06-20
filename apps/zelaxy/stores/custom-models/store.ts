import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProviderId } from '@/providers/types'
import { updateCustomProviderModels } from '@/providers/utils'

/**
 * User-added (custom) model ids per provider — e.g. an NVIDIA NIM model id not in the built-in
 * list. Persisted in localStorage and applied into the central provider registry so the models
 * appear in every picker (Agent block, Agie, ZelaxyArena) and resolve for routing/pricing.
 */
interface CustomModelsState {
  /** providerId -> list of custom model ids */
  models: Record<string, string[]>
  addModel: (providerId: ProviderId, modelId: string) => void
  removeModel: (providerId: ProviderId, modelId: string) => void
  getModels: (providerId: ProviderId) => string[]
  /** Re-apply all stored custom models into the registry (called after hydration). */
  applyAll: () => void
}

export const useCustomModelsStore = create<CustomModelsState>()(
  persist(
    (set, get) => ({
      models: {},

      addModel: (providerId, modelId) => {
        const id = modelId.trim()
        if (!id) return
        const current = get().models[providerId] || []
        if (current.includes(id)) return
        const next = { ...get().models, [providerId]: [...current, id] }
        set({ models: next })
        updateCustomProviderModels(providerId, next[providerId])
      },

      removeModel: (providerId, modelId) => {
        const current = get().models[providerId] || []
        const next = { ...get().models, [providerId]: current.filter((m) => m !== modelId) }
        set({ models: next })
        updateCustomProviderModels(providerId, next[providerId])
      },

      getModels: (providerId) => get().models[providerId] || [],

      applyAll: () => {
        const all = get().models
        for (const [providerId, ids] of Object.entries(all)) {
          updateCustomProviderModels(providerId as ProviderId, ids)
        }
      },
    }),
    {
      name: 'zelaxy-custom-models',
      // After the persisted state is restored, register the models into the registry.
      onRehydrateStorage: () => (state) => {
        state?.applyAll()
      },
    }
  )
)
