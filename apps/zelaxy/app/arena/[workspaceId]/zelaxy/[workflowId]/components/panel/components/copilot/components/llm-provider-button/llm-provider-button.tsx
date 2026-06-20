'use client'

import { ModelPicker } from '@/app/arena/[workspaceId]/zelaxyarena/model-picker'
import { getProviderFromModel } from '@/providers/utils'
import { useLLMSelectionStore } from '@/stores/llm-selection/store'

/**
 * Agie's model selector. Uses the same grouped ModelPicker as ZelaxyArena, so every provider in
 * the central registry (including MiMo) is available and custom model ids can be added — replacing
 * the old hardcoded provider/model dialog. The provider is derived from the chosen model.
 */
export function LLMProviderButton() {
  const { selectedModel, setProviderAndModel } = useLLMSelectionStore()

  return (
    <ModelPicker
      value={selectedModel}
      onChange={(model) => setProviderAndModel(getProviderFromModel(model), model)}
    />
  )
}
