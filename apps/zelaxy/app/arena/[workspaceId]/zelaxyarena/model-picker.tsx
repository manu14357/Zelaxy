'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CUSTOM_MODEL_PROVIDERS, getProviderModels, PROVIDER_DEFINITIONS } from '@/providers/models'
import type { ProviderId } from '@/providers/types'
import { getProviderFromModel } from '@/providers/utils'
import { useCustomModelsStore } from '@/stores/custom-models/store'

// Providers that accept a user-added model id (open catalogs / OpenAI-compatible gateways).
const ADDABLE_PROVIDERS = CUSTOM_MODEL_PROVIDERS.filter((id) => PROVIDER_DEFINITIONS[id])

// Providers shown in the picker, in a sensible order. Ollama is local-only; omitted here.
const PROVIDER_ORDER = [
  'anthropic',
  'openai',
  'google',
  'mimo',
  'mimo-token-plan',
  'xai',
  'deepseek',
  'groq',
  'cerebras',
  'nvidia',
  'azure-openai',
  'bedrock',
] as const

interface ProviderGroup {
  id: ProviderId
  name: string
  icon?: React.ComponentType<{ className?: string }>
  models: string[]
}

interface ModelPickerProps {
  value: string
  onChange: (model: string) => void
  disabled?: boolean
}

export function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  const customModelsMap = useCustomModelsStore((s) => s.models)
  const addCustomModel = useCustomModelsStore((s) => s.addModel)

  const [open, setOpen] = useState(false)
  const [addProvider, setAddProvider] = useState<ProviderId>('nvidia')
  const [newModelId, setNewModelId] = useState('')

  // Build provider → models groups from the central registry (includes custom models). Recomputes
  // when the user adds a custom model.
  const groups = useMemo<ProviderGroup[]>(() => {
    return PROVIDER_ORDER.map((id) => {
      const def = PROVIDER_DEFINITIONS[id]
      const models = getProviderModels(id)
      return def && models.length > 0
        ? { id: id as ProviderId, name: def.name, icon: def.icon, models }
        : null
    }).filter(Boolean) as ProviderGroup[]
    // customModelsMap is a dependency so newly-added models appear immediately.
  }, [customModelsMap])

  const handleAdd = () => {
    const id = newModelId.trim()
    if (!id) return
    addCustomModel(addProvider, id)
    onChange(id.toLowerCase())
    setNewModelId('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 w-[200px] justify-between font-normal'
          disabled={disabled}
        >
          <span className='truncate text-xs'>{value || 'Select model'}</span>
          <ChevronDown className='h-3.5 w-3.5 flex-shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[320px] p-0' align='end'>
        <Command>
          <CommandInput placeholder='Search models…' className='text-xs' />
          <CommandList className='max-h-[300px]'>
            <CommandEmpty>No models found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup
                key={group.id}
                heading={
                  <span className='flex items-center gap-1.5'>
                    {group.icon && <group.icon className='h-3 w-3' />}
                    {group.name}
                  </span>
                }
              >
                {group.models.map((m) => (
                  <CommandItem
                    key={m}
                    value={m}
                    onSelect={() => {
                      onChange(m)
                      setOpen(false)
                    }}
                    className='text-xs'
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        value.toLowerCase() === m.toLowerCase() ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className='truncate'>{m}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>

          {/* In-app "add a custom model" — no browser prompt. Pick a provider + type the id. */}
          <div className='space-y-2 border-border/50 border-t p-2.5'>
            <div className='font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
              Add a custom model
            </div>
            <div className='flex items-center gap-1.5'>
              <select
                aria-label='Provider for the custom model'
                title='Provider for the custom model'
                value={addProvider}
                onChange={(e) => setAddProvider(e.target.value as ProviderId)}
                className='h-7 rounded-md border border-input bg-background px-1.5 text-xs'
              >
                {ADDABLE_PROVIDERS.map((id) => (
                  <option key={id} value={id}>
                    {PROVIDER_DEFINITIONS[id]?.name ?? id}
                  </option>
                ))}
              </select>
              <Input
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
                placeholder='model id'
                className='h-7 flex-1 text-xs'
              />
              <Button
                size='icon'
                className='h-7 w-7 flex-shrink-0'
                onClick={handleAdd}
                disabled={!newModelId.trim()}
              >
                <Plus className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** Best-effort provider for a typed model id (used to auto-default the add-provider select). */
export function inferProvider(modelId: string): ProviderId {
  return getProviderFromModel(modelId)
}
