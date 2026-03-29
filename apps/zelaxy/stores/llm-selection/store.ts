'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSafeStorage } from '@/stores/safe-storage'

interface LLMSelectionState {
  selectedProvider: string
  selectedModel: string
  customApiKeys: Record<string, string> // Store API keys per provider
}

interface LLMSelectionActions {
  setProvider: (providerId: string) => void
  setModel: (modelId: string) => void
  setProviderAndModel: (providerId: string, modelId: string) => void
  setApiKey: (providerId: string, apiKey: string) => void
  getApiKey: (providerId: string) => string | undefined
  clearApiKey: (providerId: string) => void
}

type LLMSelectionStore = LLMSelectionState & LLMSelectionActions

export const useLLMSelectionStore = create<LLMSelectionStore>()(
  persist(
    (set, get) => ({
      // Initial state - default to NVIDIA as requested
      selectedProvider: 'nvidia',
      selectedModel: 'qwen/qwen3-coder-480b-a35b-instruct',
      customApiKeys: {}, // Initialize empty API keys object

      // Actions
      setProvider: (providerId: string) => {
        console.log('LLM Store: Setting provider to:', providerId)
        set({ selectedProvider: providerId })
      },

      setModel: (modelId: string) => {
        console.log('LLM Store: Setting model to:', modelId)
        set({ selectedModel: modelId })
      },

      setProviderAndModel: (providerId: string, modelId: string) => {
        console.log('LLM Store: Setting provider and model to:', { providerId, modelId })
        set({
          selectedProvider: providerId,
          selectedModel: modelId,
        })
      },

      setApiKey: (providerId: string, apiKey: string) => {
        console.log('LLM Store: Setting API key for provider:', providerId)
        set((state) => ({
          customApiKeys: {
            ...state.customApiKeys,
            [providerId]: apiKey,
          },
        }))
      },

      getApiKey: (providerId: string) => {
        return get().customApiKeys[providerId]
      },

      clearApiKey: (providerId: string) => {
        console.log('LLM Store: Clearing API key for provider:', providerId)
        set((state) => {
          const newApiKeys = { ...state.customApiKeys }
          delete newApiKeys[providerId]
          return { customApiKeys: newApiKeys }
        })
      },
    }),
    {
      name: 'llm-selection-storage-v2', // Changed storage key to force reset
      storage: createSafeStorage(),
      // Force reset to NVIDIA defaults for all users
      migrate: (persistedState: any, version: number) => {
        console.log(
          'LLM Store: Migrating state from version',
          version,
          'with state:',
          persistedState
        )

        // Force reset to NVIDIA for all users on version 2
        console.log('LLM Store: Force resetting to nvidia defaults')
        return {
          selectedProvider: 'nvidia',
          selectedModel: 'qwen/qwen3-coder-480b-a35b-instruct',
          customApiKeys: {}, // Reset API keys too
        }
      },
      version: 2, // Increment this to trigger migration and force reset
    }
  )
)
