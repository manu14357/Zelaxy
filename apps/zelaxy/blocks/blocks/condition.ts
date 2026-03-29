import { ConditionalIcon } from '@/components/icons'
import { isHosted } from '@/lib/environment'
import type { BlockConfig } from '@/blocks/types'
import {
  getBaseModelProviders,
  getHostedModels,
  getProviderIcon,
  providers,
} from '@/providers/utils'
import { useOllamaStore } from '@/stores/ollama/store'

// Get current Ollama models dynamically
const getCurrentOllamaModels = () => {
  return useOllamaStore.getState().models
}

interface ConditionBlockOutput {
  success: boolean
  output: {
    content: string
    conditionResult: boolean
    selectedPath: {
      blockId: string
      blockType: string
      blockTitle: string
    }
    selectedConditionId: string
    llmJudgement?: {
      reasoning: string
      confidence: number
      model: string
      decision: 'yes' | 'no'
    }
  }
}

export const ConditionBlock: BlockConfig<ConditionBlockOutput> = {
  type: 'condition',
  name: 'Condition',
  description: 'Advanced condition evaluation with LLM-as-a-Judge',
  longDescription:
    'Add a condition to the workflow to branch the execution path. Supports boolean expressions, JavaScript evaluation, and LLM-as-a-Judge for complex decision making based on natural language criteria.',
  docsLink: '#',
  bgColor: '#FF752F',
  icon: ConditionalIcon,
  category: 'blocks',
  subBlocks: [
    {
      id: 'evaluationMode',
      type: 'dropdown',
      title: 'Evaluation Mode',
      layout: 'half',
      options: [
        { label: 'Boolean Expression', id: 'expression' },
        { label: 'LLM as Judge', id: 'llm' },
      ],
    },
    {
      id: 'conditions',
      type: 'condition-input',
      title: 'Boolean Expression',
      layout: 'full',
      placeholder: 'e.g., {{agent1.content}}==1 or content.length > 10',
      condition: {
        field: 'evaluationMode',
        value: 'expression',
      },
    },
    {
      id: 'llmPrompt',
      type: 'long-input',
      title: 'LLM Judge Prompt',
      layout: 'full',
      rows: 4,
      placeholder:
        'Describe the criteria for the LLM to evaluate. The LLM will respond with YES or NO based on your criteria.\n\nExample: "Is the content positive and professional in tone?"',
      condition: {
        field: 'evaluationMode',
        value: 'llm',
      },
    },
    {
      id: 'llmContext',
      type: 'long-input',
      title: 'Context for Evaluation',
      layout: 'full',
      rows: 3,
      placeholder: 'Provide context data for the LLM to evaluate (e.g., {{agent1.content}})',
      condition: {
        field: 'evaluationMode',
        value: 'llm',
      },
    },
    {
      id: 'llmModel',
      type: 'combobox',
      title: 'LLM Model',
      layout: 'half',
      placeholder: 'Select or type a model name...',
      required: true,
      options: () => {
        const ollamaModels = useOllamaStore.getState().models
        const baseModels = Object.keys(getBaseModelProviders())
        const allModels = [...baseModels, ...ollamaModels]

        return allModels.map((model) => {
          const icon = getProviderIcon(model)
          return {
            label: model,
            id: model,
            ...(icon && { icon }),
          }
        })
      },
      condition: {
        field: 'evaluationMode',
        value: 'llm',
      },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your API key',
      password: true,
      connectionDroppable: false,
      required: true,
      condition: isHosted
        ? {
            field: 'llmModel',
            value: getHostedModels(),
            not: true,
            and: {
              field: 'evaluationMode',
              value: 'llm',
            },
          }
        : () => ({
            field: 'llmModel',
            value: getCurrentOllamaModels(),
            not: true,
            and: {
              field: 'evaluationMode',
              value: 'llm',
            },
          }),
    },
    {
      id: 'azureEndpoint',
      title: 'Azure OpenAI Endpoint',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'https://your-resource.openai.azure.com',
      connectionDroppable: false,
      condition: {
        field: 'llmModel',
        value: providers['azure-openai'].models,
        and: {
          field: 'evaluationMode',
          value: 'llm',
        },
      },
    },
    {
      id: 'azureApiVersion',
      title: 'Azure API Version',
      type: 'short-input',
      layout: 'full',
      placeholder: '2024-07-01-preview',
      connectionDroppable: false,
      condition: {
        field: 'llmModel',
        value: providers['azure-openai'].models,
        and: {
          field: 'evaluationMode',
          value: 'llm',
        },
      },
    },
    {
      id: 'requireConfidence',
      type: 'switch',
      title: 'Require High Confidence',
      layout: 'half',
      description: 'Only accept decisions with high confidence (>80%)',
      condition: {
        field: 'evaluationMode',
        value: 'llm',
      },
    },
  ],
  tools: {
    access: [],
  },
  inputs: {},
  outputs: {
    content: { type: 'string', description: 'Condition evaluation content' },
    conditionResult: { type: 'boolean', description: 'Boolean result of condition evaluation' },
    selectedPath: { type: 'json', description: 'Selected execution path information' },
    selectedConditionId: { type: 'string', description: 'Selected path identifier (true/false)' },
    llmJudgement: { type: 'json', description: 'LLM judgement details when using LLM mode' },
  },
}
