'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CopyButton } from '@/components/ui/copy-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ExampleCommandProps {
  command: string
  apiKey: string
  endpoint: string
  showLabel?: boolean
  getInputFormatExample?: () => string
}

type ExampleMode = 'sync' | 'async'
type ExampleType = 'execute' | 'status' | 'rate-limits'

export function ExampleCommand({
  command,
  apiKey,
  endpoint,
  showLabel = true,
  getInputFormatExample,
}: ExampleCommandProps) {
  const [mode, setMode] = useState<ExampleMode>('sync')
  const [exampleType, setExampleType] = useState<ExampleType>('execute')

  const formatCurlCommand = (command: string, apiKey: string) => {
    if (!command.includes('curl')) return command
    const sanitizedCommand = command.replace(apiKey, 'ZELAXY_API_KEY')
    return sanitizedCommand
      .replace(' -H ', '\n  -H ')
      .replace(' -d ', '\n  -d ')
      .replace(' http', '\n  http')
  }

  const getActualCommand = () => {
    const baseEndpoint = endpoint
    const inputExample = getInputFormatExample
      ? getInputFormatExample()
      : ' -d \'{"input": "your data here"}\''

    switch (mode) {
      case 'sync':
        return command

      case 'async':
        switch (exampleType) {
          case 'execute':
            return `curl -X POST \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -H "X-Execution-Mode: async"${inputExample} \\
  ${baseEndpoint}`

          case 'status': {
            const baseUrl = baseEndpoint.split('/api/workflows/')[0]
            return `curl -H "X-API-Key: ${apiKey}" \\
  ${baseUrl}/api/jobs/JOB_ID_FROM_EXECUTION`
          }

          case 'rate-limits': {
            const baseUrlForRateLimit = baseEndpoint.split('/api/workflows/')[0]
            return `curl -H "X-API-Key: ${apiKey}" \\
  ${baseUrlForRateLimit}/api/users/rate-limit`
          }

          default:
            return command
        }

      default:
        return command
    }
  }

  const getDisplayCommand = () => {
    const baseEndpoint = endpoint.replace(apiKey, 'ZELAXY_API_KEY')
    const inputExample = getInputFormatExample
      ? getInputFormatExample()
      : ' -d \'{"input": "your data here"}\''

    switch (mode) {
      case 'sync':
        return formatCurlCommand(command, apiKey)

      case 'async':
        switch (exampleType) {
          case 'execute':
            return `curl -X POST \\
  -H "X-API-Key: ZELAXY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "X-Execution-Mode: async"${inputExample} \\
  ${baseEndpoint}`

          case 'status': {
            const baseUrl = baseEndpoint.split('/api/workflows/')[0]
            return `curl -H "X-API-Key: ZELAXY_API_KEY" \\
  ${baseUrl}/api/jobs/JOB_ID_FROM_EXECUTION`
          }

          case 'rate-limits': {
            const baseUrlForRateLimit = baseEndpoint.split('/api/workflows/')[0]
            return `curl -H "X-API-Key: ZELAXY_API_KEY" \\
  ${baseUrlForRateLimit}/api/users/rate-limit`
          }

          default:
            return formatCurlCommand(command, apiKey)
        }

      default:
        return formatCurlCommand(command, apiKey)
    }
  }

  const getExampleTitle = () => {
    switch (exampleType) {
      case 'execute':
        return 'Async Execution'
      case 'status':
        return 'Check Job Status'
      case 'rate-limits':
        return 'Rate Limits & Usage'
      default:
        return 'Async Execution'
    }
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        {showLabel && (
          <Label className='font-medium text-[13px] text-foreground/70 uppercase tracking-wider'>
            Example
          </Label>
        )}
        <div className='flex items-center gap-1'>
          <div className='flex rounded-lg bg-muted/50 p-0.5'>
            <button
              onClick={() => setMode('sync')}
              className={cn(
                'rounded-md px-3 py-1 font-medium text-[12px] transition-all duration-200',
                mode === 'sync'
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sync
            </button>
            <button
              onClick={() => setMode('async')}
              className={cn(
                'rounded-md px-3 py-1 font-medium text-[12px] transition-all duration-200',
                mode === 'async'
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Async
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium text-[12px] transition-all duration-150',
                  mode === 'sync'
                    ? 'cursor-not-allowed text-muted-foreground/50'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
                disabled={mode === 'sync'}
              >
                <span className='truncate'>{getExampleTitle()}</span>
                <ChevronDown className='h-3 w-3 flex-shrink-0' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='rounded-xl'>
              <DropdownMenuItem
                className='cursor-pointer rounded-lg text-[13px]'
                onClick={() => setExampleType('execute')}
              >
                Async Execution
              </DropdownMenuItem>
              <DropdownMenuItem
                className='cursor-pointer rounded-lg text-[13px]'
                onClick={() => setExampleType('status')}
              >
                Check Job Status
              </DropdownMenuItem>
              <DropdownMenuItem
                className='cursor-pointer rounded-lg text-[13px]'
                onClick={() => setExampleType('rate-limits')}
              >
                Rate Limits & Usage
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className='group relative h-[120px] overflow-hidden rounded-xl border border-border/50 bg-muted/30 transition-all duration-150 hover:border-border hover:bg-muted/50'>
        <pre className='h-full overflow-auto whitespace-pre-wrap p-3.5 font-mono text-[13px] text-foreground/90 leading-relaxed'>
          {getDisplayCommand()}
        </pre>
        <CopyButton text={getActualCommand()} />
      </div>
    </div>
  )
}
