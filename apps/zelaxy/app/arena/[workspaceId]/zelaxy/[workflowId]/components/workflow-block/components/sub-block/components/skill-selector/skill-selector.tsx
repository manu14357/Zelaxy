'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Sparkles, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createLogger } from '@/lib/logs/console/logger'
import { useSubBlockValue } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/hooks/use-sub-block-value'
import type { SubBlockConfig } from '@/blocks/types'

const logger = createLogger('SkillSelector')

interface SkillOption {
  id: string
  name: string
  description: string
}

interface SkillSelectorProps {
  blockId: string
  subBlock: SubBlockConfig
  disabled?: boolean
  isPreview?: boolean
  previewValue?: any
}

export function SkillSelector({
  blockId,
  subBlock,
  disabled = false,
  isPreview = false,
  previewValue,
}: SkillSelectorProps) {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [skills, setSkills] = useState<SkillOption[]>([])
  const [open, setOpen] = useState(false)
  const [storeValue, setStoreValue] = useSubBlockValue(blockId, subBlock.id)

  const value = isPreview ? previewValue : storeValue
  const selected: SkillOption[] = useMemo(
    () => (Array.isArray(value) ? value.filter((s: any) => s?.name) : []),
    [value]
  )
  const selectedNames = useMemo(() => new Set(selected.map((s) => s.name)), [selected])

  const fetchSkills = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/skills?workspaceId=${workspaceId}`)
      if (!res.ok) return
      const json = await res.json()
      setSkills(
        (json.skills ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
        }))
      )
    } catch (err) {
      logger.error('load skills failed', { err })
    }
  }, [workspaceId])

  useEffect(() => {
    if (open) fetchSkills()
  }, [open, fetchSkills])

  const toggle = useCallback(
    (skill: SkillOption) => {
      if (isPreview || disabled) return
      const exists = selectedNames.has(skill.name)
      const next = exists
        ? selected.filter((s) => s.name !== skill.name)
        : [...selected, { id: skill.id, name: skill.name, description: skill.description }]
      setStoreValue(next)
    },
    [selected, selectedNames, setStoreValue, isPreview, disabled]
  )

  const remove = useCallback(
    (name: string) => {
      if (isPreview || disabled) return
      setStoreValue(selected.filter((s) => s.name !== name))
    },
    [selected, setStoreValue, isPreview, disabled]
  )

  return (
    <div className='space-y-2'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='h-9 w-full justify-between font-normal'
            disabled={disabled || isPreview}
          >
            <span className='flex items-center gap-2 text-muted-foreground'>
              <Sparkles className='h-4 w-4' />
              {selected.length > 0 ? `${selected.length} skill(s) attached` : 'Add skills…'}
            </span>
            <ChevronDown className='h-4 w-4 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[320px] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search skills…' />
            <CommandList>
              <CommandEmpty>No skills found. Create skills in the Skills hub tab.</CommandEmpty>
              <CommandGroup>
                {skills.map((skill) => {
                  const isSel = selectedNames.has(skill.name)
                  return (
                    <CommandItem
                      key={skill.id}
                      value={skill.name}
                      onSelect={() => toggle(skill)}
                      className='flex items-start gap-2'
                    >
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isSel ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <div className='min-w-0'>
                        <div className='truncate font-medium text-sm'>{skill.name}</div>
                        <div className='truncate text-[12px] text-muted-foreground'>
                          {skill.description}
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {selected.map((s) => (
            <span
              key={s.name}
              className='inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs'
            >
              <Sparkles className='h-3 w-3 text-muted-foreground' />
              {s.name}
              {!isPreview && !disabled && (
                <button
                  type='button'
                  onClick={() => remove(s.name)}
                  className='text-muted-foreground hover:text-destructive'
                >
                  <X className='h-3 w-3' />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
