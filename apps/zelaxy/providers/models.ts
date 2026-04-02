/**
 * Comprehensive provider definitions - Single source of truth
 * This file contains all provider and model information including:
 * - Model lists
 * - Pricing information
 * - Model capabilities (temperature support, etc.)
 * - Provider configurations
 */

import type React from 'react'
import {
  AnthropicIcon,
  AzureIcon,
  BedrockIcon,
  CerebrasIcon,
  DeepseekIcon,
  GeminiIcon,
  GroqIcon,
  NvidiaIcon,
  OllamaIcon,
  OpenAIIcon,
  xAIIcon,
} from '@/components/icons'

export interface ModelPricing {
  input: number // Per 1M tokens
  cachedInput?: number // Per 1M tokens (if supported)
  output: number // Per 1M tokens
  updatedAt: string
}

export interface ModelCapabilities {
  temperature?: {
    min: number
    max: number
  }
  toolUsageControl?: boolean
  computerUse?: boolean
}

export interface ModelDefinition {
  id: string
  pricing: ModelPricing
  capabilities: ModelCapabilities
}

export interface ProviderDefinition {
  id: string
  name: string
  description: string
  models: ModelDefinition[]
  defaultModel: string
  modelPatterns?: RegExp[]
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * Comprehensive provider definitions, single source of truth
 */
export const PROVIDER_DEFINITIONS: Record<string, ProviderDefinition> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: "OpenAI's models",
    defaultModel: 'gpt-5.4',
    modelPatterns: [/^gpt/, /^o1/, /^o3/, /^o4/],
    icon: OpenAIIcon,
    models: [
      {
        id: 'gpt-4o',
        pricing: {
          input: 2.5,
          cachedInput: 1.25,
          output: 10.0,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-5',
        pricing: {
          input: 1.25,
          cachedInput: 0.125,
          output: 10.0,
          updatedAt: '2025-08-07',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-5-mini',
        pricing: {
          input: 0.25,
          cachedInput: 0.025,
          output: 2.0,
          updatedAt: '2025-08-07',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-5-nano',
        pricing: {
          input: 0.05,
          cachedInput: 0.005,
          output: 0.4,
          updatedAt: '2025-08-07',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-5-chat-latest',
        pricing: {
          input: 1.25,
          cachedInput: 0.125,
          output: 10.0,
          updatedAt: '2025-08-07',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'o1',
        pricing: {
          input: 15.0,
          cachedInput: 7.5,
          output: 60,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'o3',
        pricing: {
          input: 2,
          cachedInput: 0.5,
          output: 8,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'o4-mini',
        pricing: {
          input: 1.1,
          cachedInput: 0.275,
          output: 4.4,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-4.1',
        pricing: {
          input: 2.0,
          cachedInput: 0.5,
          output: 8.0,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-4.1-nano',
        pricing: {
          input: 0.1,
          cachedInput: 0.025,
          output: 0.4,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-4.1-mini',
        pricing: {
          input: 0.4,
          cachedInput: 0.1,
          output: 1.6,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-5.4',
        pricing: {
          input: 2.5,
          cachedInput: 0.25,
          output: 15.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-5.4-mini',
        pricing: {
          input: 0.75,
          cachedInput: 0.075,
          output: 4.5,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gpt-5.4-nano',
        pricing: {
          input: 0.2,
          cachedInput: 0.02,
          output: 1.25,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
    ],
  },
  'azure-openai': {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    description: 'Microsoft Azure OpenAI Service models',
    defaultModel: 'azure/gpt-4o',
    modelPatterns: [/^azure\//],
    icon: AzureIcon,
    models: [
      {
        id: 'azure/gpt-4o',
        pricing: {
          input: 2.5,
          cachedInput: 1.25,
          output: 10.0,
          updatedAt: '2025-06-15',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/gpt-5',
        pricing: {
          input: 1.25,
          cachedInput: 0.125,
          output: 10.0,
          updatedAt: '2025-08-07',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/gpt-5-mini',
        pricing: {
          input: 0.25,
          cachedInput: 0.025,
          output: 2.0,
          updatedAt: '2025-08-07',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/gpt-5-nano',
        pricing: {
          input: 0.05,
          cachedInput: 0.005,
          output: 0.4,
          updatedAt: '2025-08-07',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/gpt-5-chat-latest',
        pricing: {
          input: 1.25,
          cachedInput: 0.125,
          output: 10.0,
          updatedAt: '2025-08-07',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/o3',
        pricing: {
          input: 10,
          cachedInput: 2.5,
          output: 40,
          updatedAt: '2025-06-15',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/o4-mini',
        pricing: {
          input: 1.1,
          cachedInput: 0.275,
          output: 4.4,
          updatedAt: '2025-06-15',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/gpt-4.1',
        pricing: {
          input: 2.0,
          cachedInput: 0.5,
          output: 8.0,
          updatedAt: '2025-06-15',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/model-router',
        pricing: {
          input: 2.0,
          cachedInput: 0.5,
          output: 8.0,
          updatedAt: '2025-06-15',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/gpt-5.4',
        pricing: {
          input: 2.5,
          cachedInput: 0.25,
          output: 15.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'azure/gpt-5.4-mini',
        pricing: {
          input: 0.75,
          cachedInput: 0.075,
          output: 4.5,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: "Anthropic's Claude models",
    defaultModel: 'claude-sonnet-4-6',
    modelPatterns: [/^claude/],
    icon: AnthropicIcon,
    models: [
      {
        id: 'claude-opus-4-6',
        pricing: {
          input: 5.0,
          cachedInput: 2.5,
          output: 25.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'claude-sonnet-4-6',
        pricing: {
          input: 3.0,
          cachedInput: 1.5,
          output: 15.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'claude-haiku-4-5',
        pricing: {
          input: 1.0,
          cachedInput: 0.5,
          output: 5.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'claude-sonnet-4-0',
        pricing: {
          input: 3.0,
          cachedInput: 1.5,
          output: 15.0,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'claude-opus-4-0',
        pricing: {
          input: 15.0,
          cachedInput: 7.5,
          output: 75.0,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'claude-3-7-sonnet-latest',
        pricing: {
          input: 3.0,
          cachedInput: 1.5,
          output: 15.0,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
          computerUse: true,
        },
      },
      {
        id: 'claude-3-5-sonnet-latest',
        pricing: {
          input: 3.0,
          cachedInput: 1.5,
          output: 15.0,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
          computerUse: true,
        },
      },
    ],
  },
  google: {
    id: 'google',
    name: 'Google',
    description: "Google's Gemini models",
    defaultModel: 'gemini-2.5-pro',
    modelPatterns: [/^gemini/],
    icon: GeminiIcon,
    models: [
      {
        id: 'gemini-3-flash',
        pricing: {
          input: 0.15,
          cachedInput: 0.075,
          output: 0.6,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gemini-2.5-pro',
        pricing: {
          input: 0.15,
          cachedInput: 0.075,
          output: 0.6,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gemini-2.5-flash',
        pricing: {
          input: 0.15,
          cachedInput: 0.075,
          output: 0.6,
          updatedAt: '2025-06-17',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'gemini-2.5-flash-lite',
        pricing: {
          input: 0.075,
          cachedInput: 0.01875,
          output: 0.3,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'Deepseek',
    description: "Deepseek's chat models",
    defaultModel: 'deepseek-chat',
    modelPatterns: [],
    icon: DeepseekIcon,
    models: [
      {
        id: 'deepseek-chat',
        pricing: {
          input: 0.75,
          cachedInput: 0.4,
          output: 1.0,
          updatedAt: '2025-03-21',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'deepseek-v3',
        pricing: {
          input: 0.75,
          cachedInput: 0.4,
          output: 1.0,
          updatedAt: '2025-03-21',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'deepseek-r1',
        pricing: {
          input: 1.0,
          cachedInput: 0.5,
          output: 1.5,
          updatedAt: '2025-03-21',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
      {
        id: 'deepseek-reasoner',
        pricing: {
          input: 0.28,
          cachedInput: 0.028,
          output: 0.42,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          toolUsageControl: true,
        },
      },
    ],
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    description: "xAI's Grok models",
    defaultModel: 'grok-4-latest',
    modelPatterns: [/^grok/],
    icon: xAIIcon,
    models: [
      {
        id: 'grok-4.20-latest',
        pricing: {
          input: 5.0,
          cachedInput: 2.5,
          output: 25.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'grok-4-latest',
        pricing: {
          input: 5.0,
          cachedInput: 2.5,
          output: 25.0,
          updatedAt: '2025-07-10',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'grok-3-latest',
        pricing: {
          input: 3.0,
          cachedInput: 1.5,
          output: 15.0,
          updatedAt: '2025-04-17',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'grok-3-fast-latest',
        pricing: {
          input: 5.0,
          cachedInput: 2.5,
          output: 25.0,
          updatedAt: '2025-04-17',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
    ],
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    description: 'Cerebras Cloud LLMs',
    defaultModel: 'cerebras/llama-3.3-70b',
    modelPatterns: [/^cerebras/],
    icon: CerebrasIcon,
    models: [
      {
        id: 'cerebras/llama-3.3-70b',
        pricing: {
          input: 0.94,
          cachedInput: 0.47,
          output: 0.94,
          updatedAt: '2025-03-21',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'cerebras/llama3.1-8b',
        pricing: {
          input: 0.1,
          cachedInput: 0.05,
          output: 0.1,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'cerebras/gpt-oss-120b',
        pricing: {
          input: 0.6,
          cachedInput: 0.3,
          output: 0.6,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: "Groq's LLM models with high-performance inference",
    defaultModel: 'groq/openai/gpt-oss-120b',
    modelPatterns: [/^groq/],
    icon: GroqIcon,
    models: [
      {
        id: 'groq/openai/gpt-oss-120b',
        pricing: {
          input: 0.15,
          cachedInput: 0.075,
          output: 0.75,
          updatedAt: '2025-08-05',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/openai/gpt-oss-20b',
        pricing: {
          input: 0.01,
          cachedInput: 0.005,
          output: 0.25,
          updatedAt: '2025-08-05',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/gemma2-9b-it',
        pricing: {
          input: 0.04,
          cachedInput: 0.02,
          output: 0.04,
          updatedAt: '2025-08-05',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/llama-3.1-8b-instant',
        pricing: {
          input: 0.05,
          cachedInput: 0.025,
          output: 0.08,
          updatedAt: '2025-08-05',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/llama-3.3-70b-versatile',
        pricing: {
          input: 0.35,
          cachedInput: 0.175,
          output: 0.61,
          updatedAt: '2025-08-05',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/meta-llama/llama-guard-4-12b',
        pricing: {
          input: 0.2,
          cachedInput: 0.1,
          output: 0.2,
          updatedAt: '2025-08-05',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/deepseek-r1-distill-llama-70b',
        pricing: {
          input: 0.58,
          cachedInput: 0.29,
          output: 0.99,
          updatedAt: '2025-08-05',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/meta-llama/llama-4-maverick-17b-128e-instruct',
        pricing: {
          input: 0.2,
          cachedInput: 0.1,
          output: 0.6,
          updatedAt: '2025-08-05',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/meta-llama/llama-4-scout-17b-16e-instruct',
        pricing: {
          input: 0.11,
          cachedInput: 0.055,
          output: 0.34,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
      {
        id: 'groq/qwen/qwen3-32b',
        pricing: {
          input: 0.29,
          cachedInput: 0.145,
          output: 0.59,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          toolUsageControl: false,
        },
      },
    ],
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA',
    description: 'NVIDIA NIM (NVIDIA Inference Microservices) API',
    defaultModel: 'qwen/qwen3-coder-480b-a35b-instruct',
    modelPatterns: [/^qwen/, /^nvidia/, /^meta/, /^microsoft/, /^mistralai/, /^google/],
    icon: NvidiaIcon,
    models: [
      {
        id: 'qwen/qwen3-coder-480b-a35b-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: false,
        },
      },
      {
        id: 'nvidia/llama-3.1-nemotron-70b-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: false,
        },
      },
      {
        id: 'meta/llama-3.1-405b-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: false,
        },
      },
      {
        id: 'meta/llama-3.1-70b-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: false,
        },
      },
      {
        id: 'microsoft/phi-3-medium-4k-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: false,
        },
      },
    ],
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    description: 'Local LLM models via Ollama',
    defaultModel: '',
    modelPatterns: [],
    icon: OllamaIcon,
    models: [], // Populated dynamically
  },
  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    description: 'AWS Bedrock foundation models',
    defaultModel: 'openai.gpt-oss-20b-1:0',
    modelPatterns: [
      /^amazon\./,
      /^anthropic\./,
      /^meta\./,
      /^mistral\./,
      /^cohere\./,
      /^ai21\./,
      /^openai\./,
      /^qwen\./,
      /^google\./,
      /^minimax\./,
      /^moonshot\./,
      /^nvidia\./,
    ],
    icon: BedrockIcon,
    models: [
      // OpenAI on Bedrock
      {
        id: 'openai.gpt-oss-20b-1:0',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-24',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'openai.gpt-oss-safeguard-20b',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'openai.gpt-oss-safeguard-120b',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      // Amazon Nova
      {
        id: 'amazon.nova-pro-v1:0',
        pricing: {
          input: 0.8,
          output: 3.2,
          updatedAt: '2025-02-24',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'amazon.nova-lite-v1:0',
        pricing: {
          input: 0.06,
          output: 0.24,
          updatedAt: '2025-02-24',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'amazon.nova-micro-v1:0',
        pricing: {
          input: 0.035,
          output: 0.14,
          updatedAt: '2025-02-24',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      // Anthropic Claude on Bedrock
      {
        id: 'anthropic.claude-sonnet-4-6',
        pricing: {
          input: 3.0,
          output: 15.0,
          updatedAt: '2025-10-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        pricing: {
          input: 3.0,
          output: 15.0,
          updatedAt: '2025-02-24',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'anthropic.claude-3-5-haiku-20241022-v1:0',
        pricing: {
          input: 0.8,
          output: 4.0,
          updatedAt: '2025-02-24',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      // Meta Llama on Bedrock
      {
        id: 'meta.llama3-3-70b-instruct-v1:0',
        pricing: {
          input: 0.72,
          output: 0.72,
          updatedAt: '2025-02-24',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      // Qwen on Bedrock
      {
        id: 'qwen.qwen3-next-80b-a3b',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'qwen.qwen3-vl-235b-a22b',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      // Google Gemma on Bedrock
      {
        id: 'google.gemma-3-4b-it',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'google.gemma-3-12b-it',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'google.gemma-3-27b-it',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      // MiniMax on Bedrock
      {
        id: 'minimax.minimax-m2',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      // Moonshot AI on Bedrock
      {
        id: 'moonshot.kimi-k2-thinking',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      // NVIDIA on Bedrock
      {
        id: 'nvidia.nemotron-nano-9b-v2',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      {
        id: 'nvidia.nemotron-nano-12b-v2',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 2 },
          toolUsageControl: true,
        },
      },
      // Mistral on Bedrock
      {
        id: 'mistral.magistral-small-2509',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'mistral.voxtral-mini-3b-2507',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'mistral.voxtral-small-24b-2507',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'mistral.ministral-3-3b-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'mistral.ministral-3-8b-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'mistral.ministral-3-14b-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
      {
        id: 'mistral.mistral-large-3-675b-instruct',
        pricing: {
          input: 0.0,
          output: 0.0,
          updatedAt: '2025-02-25',
        },
        capabilities: {
          temperature: { min: 0, max: 1 },
          toolUsageControl: true,
        },
      },
    ],
  },
}

// Helper functions to extract information from the comprehensive definitions

/**
 * Get all models for a specific provider
 */
export function getProviderModels(providerId: string): string[] {
  return PROVIDER_DEFINITIONS[providerId]?.models.map((m) => m.id) || []
}

/**
 * Get the default model for a specific provider
 */
export function getProviderDefaultModel(providerId: string): string {
  return PROVIDER_DEFINITIONS[providerId]?.defaultModel || ''
}

/**
 * Get pricing information for a specific model
 */
export function getModelPricing(modelId: string): ModelPricing | null {
  for (const provider of Object.values(PROVIDER_DEFINITIONS)) {
    const model = provider.models.find((m) => m.id.toLowerCase() === modelId.toLowerCase())
    if (model) {
      return model.pricing
    }
  }
  return null
}

/**
 * Get capabilities for a specific model
 */
export function getModelCapabilities(modelId: string): ModelCapabilities | null {
  for (const provider of Object.values(PROVIDER_DEFINITIONS)) {
    const model = provider.models.find((m) => m.id.toLowerCase() === modelId.toLowerCase())
    if (model) {
      return model.capabilities
    }
  }
  return null
}

/**
 * Get all models that support temperature
 */
export function getModelsWithTemperatureSupport(): string[] {
  const models: string[] = []
  for (const provider of Object.values(PROVIDER_DEFINITIONS)) {
    for (const model of provider.models) {
      if (model.capabilities.temperature) {
        models.push(model.id)
      }
    }
  }
  return models
}

/**
 * Get all models with temperature range 0-1
 */
export function getModelsWithTempRange01(): string[] {
  const models: string[] = []
  for (const provider of Object.values(PROVIDER_DEFINITIONS)) {
    for (const model of provider.models) {
      if (model.capabilities.temperature?.max === 1) {
        models.push(model.id)
      }
    }
  }
  return models
}

/**
 * Get all models with temperature range 0-2
 */
export function getModelsWithTempRange02(): string[] {
  const models: string[] = []
  for (const provider of Object.values(PROVIDER_DEFINITIONS)) {
    for (const model of provider.models) {
      if (model.capabilities.temperature?.max === 2) {
        models.push(model.id)
      }
    }
  }
  return models
}

/**
 * Get all providers that support tool usage control
 */
export function getProvidersWithToolUsageControl(): string[] {
  const providers: string[] = []
  for (const [providerId, provider] of Object.entries(PROVIDER_DEFINITIONS)) {
    if (provider.models.some((model) => model.capabilities.toolUsageControl)) {
      providers.push(providerId)
    }
  }
  return providers
}

/**
 * Get all models that are hosted (don't require user API keys)
 */
export function getHostedModels(): string[] {
  // Currently, OpenAI and Anthropic models are hosted
  return [...getProviderModels('openai'), ...getProviderModels('anthropic')]
}

/**
 * Get all computer use models
 */
export function getComputerUseModels(): string[] {
  const models: string[] = []
  for (const provider of Object.values(PROVIDER_DEFINITIONS)) {
    for (const model of provider.models) {
      if (model.capabilities.computerUse) {
        models.push(model.id)
      }
    }
  }
  return models
}

/**
 * Check if a model supports temperature
 */
export function supportsTemperature(modelId: string): boolean {
  const capabilities = getModelCapabilities(modelId)
  return !!capabilities?.temperature
}

/**
 * Get maximum temperature for a model
 */
export function getMaxTemperature(modelId: string): number | undefined {
  const capabilities = getModelCapabilities(modelId)
  return capabilities?.temperature?.max
}

/**
 * Check if a provider supports tool usage control
 */
export function supportsToolUsageControl(providerId: string): boolean {
  return getProvidersWithToolUsageControl().includes(providerId)
}

/**
 * Update Ollama models dynamically
 */
export function updateOllamaModels(models: string[]): void {
  PROVIDER_DEFINITIONS.ollama.models = models.map((modelId) => ({
    id: modelId,
    pricing: {
      input: 0,
      output: 0,
      updatedAt: new Date().toISOString().split('T')[0],
    },
    capabilities: {},
  }))
}

/**
 * Embedding model pricing - separate from chat models
 */
export const EMBEDDING_MODEL_PRICING: Record<string, ModelPricing> = {
  'text-embedding-3-small': {
    input: 0.02, // $0.02 per 1M tokens
    output: 0.0,
    updatedAt: '2025-07-10',
  },
  'text-embedding-3-large': {
    input: 0.13, // $0.13 per 1M tokens
    output: 0.0,
    updatedAt: '2025-07-10',
  },
  'text-embedding-ada-002': {
    input: 0.1, // $0.1 per 1M tokens
    output: 0.0,
    updatedAt: '2025-07-10',
  },
}

/**
 * Get pricing for embedding models specifically
 */
export function getEmbeddingModelPricing(modelId: string): ModelPricing | null {
  return EMBEDDING_MODEL_PRICING[modelId] || null
}
