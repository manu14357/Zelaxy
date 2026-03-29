import { create } from 'zustand'
import { createLogger } from '@/lib/logs/console/logger'
import { updateOllamaProviderModels } from '@/providers/utils'
import type { OllamaStore } from '@/stores/ollama/types'

const logger = createLogger('OllamaStore')

// Fetch models from the server API when on client side
const fetchOllamaModels = async (): Promise<string[]> => {
  try {
    const response = await fetch('/api/providers/ollama/models')
    if (!response.ok) {
      logger.debug('Failed to fetch Ollama models from API', {
        status: response.status,
      })
      return []
    }
    const data = await response.json()
    return data.models || []
  } catch (error) {
    logger.debug('Error fetching Ollama models', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

export const useOllamaStore = create<OllamaStore>((set, get) => ({
  models: [],
  isLoading: false,
  setModels: (models) => {
    set({ models })
    // Update the providers when models change
    updateOllamaProviderModels(models)
  },

  // Fetch models from API (client-side only)
  fetchModels: async () => {
    if (typeof window === 'undefined') {
      logger.info('Skipping client-side model fetch on server')
      return
    }

    if (get().isLoading) {
      logger.info('Model fetch already in progress')
      return
    }

    logger.debug('Fetching Ollama models from API')
    set({ isLoading: true })

    try {
      const models = await fetchOllamaModels()
      if (models.length > 0) {
        logger.info(`Ollama: ${models.length} models available`)
      }
      get().setModels(models)
    } catch (error) {
      logger.error('Failed to fetch Ollama models', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      set({ isLoading: false })
    }
  },
}))

// Auto-fetch models when the store is first accessed on the client
if (typeof window !== 'undefined') {
  // Delay to avoid hydration issues
  setTimeout(() => {
    useOllamaStore.getState().fetchModels()
  }, 1000)
}
