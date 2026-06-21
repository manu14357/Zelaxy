'use client'

import { ModelPicker } from '@/app/arena/[workspaceId]/zelaxyarena/model-picker'
import { getProviderFromModel } from '@/providers/utils'
import { useLLMSelectionStore } from '@/stores/llm-selection/store'

/**
 * Agie's model selector — the same dropdown ModelPicker that ZelaxyArena uses (no settings dialog).
 * Selecting a model updates Agie's LLM-selection store (model + derived provider). API keys resolve
 * server-side from the user's environment variables (direct-chat falls back to env/system keys),
 * matching ZelaxyArena's behavior — there's no per-provider key dialog anymore.
 */
export function LLMProviderButton() {
  const { selectedModel, selectedProvider, setProviderAndModel } = useLLMSelectionStore()

  return (
    <ModelPicker
      value={selectedModel}
      onChange={(modelId) =>
        setProviderAndModel(getProviderFromModel(modelId) || selectedProvider, modelId)
      }
    />
  )
}
