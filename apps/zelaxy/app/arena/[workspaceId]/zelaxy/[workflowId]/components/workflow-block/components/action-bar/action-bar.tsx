import { Circle, CircleOff, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import { useCollaborativeWorkflow } from '@/hooks/use-collaborative-workflow'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'

interface ActionBarProps {
  blockId: string
  blockType: string
  disabled?: boolean
}

export function ActionBar({ blockId, blockType, disabled = false }: ActionBarProps) {
  const { collaborativeRemoveBlock, collaborativeToggleBlockEnabled, collaborativeDuplicateBlock } =
    useCollaborativeWorkflow()
  const isEnabled = useWorkflowStore((state) => state.blocks[blockId]?.enabled ?? true)
  const userPermissions = useUserPermissionsContext()

  const isStarterBlock = blockType === 'starter'

  const getTooltipMessage = (defaultMessage: string) => {
    if (disabled) {
      return userPermissions.isOfflineMode ? 'Connection lost - please refresh' : 'Read-only mode'
    }
    return defaultMessage
  }

  return (
    <div
      className={cn(
        '-bottom-12 -translate-x-1/2 absolute left-1/2',
        'flex flex-row items-center gap-2',
        'opacity-0 transition-all duration-300 ease-out group-hover:opacity-100',
        'z-[60] p-0'
      )}
    >
      {/* <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              isEnabled
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
            )}
            size="sm"
            disabled={!isEnabled}
          >
            <Play fill="currentColor" className="!h-3.5 !w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Run Block</TooltipContent>
      </Tooltip> */}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              if (!disabled) {
                collaborativeToggleBlockEnabled(blockId)
              }
            }}
            className={cn(
              'h-8 w-8 rounded-full p-0 transition-all duration-200',
              'border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm',
              isEnabled
                ? 'text-emerald-500 hover:border-emerald-400/30 hover:bg-emerald-500/20 hover:text-emerald-400'
                : 'text-gray-400 hover:border-gray-400/30 hover:bg-gray-500/20 hover:text-gray-300',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            disabled={disabled}
          >
            {isEnabled ? (
              <Circle className='h-4 w-4 fill-current' />
            ) : (
              <CircleOff className='h-4 w-4' />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='font-medium text-xs'>
          {getTooltipMessage(isEnabled ? 'Disable Block' : 'Enable Block')}
        </TooltipContent>
      </Tooltip>

      {!isStarterBlock && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (!disabled) {
                  collaborativeDuplicateBlock(blockId)
                }
              }}
              className={cn(
                'h-8 w-8 rounded-full p-0 transition-all duration-200',
                'border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm',
                'text-primary hover:border-primary/30 hover:bg-primary/100/20 hover:text-primary/80',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              disabled={disabled}
            >
              <Copy className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent side='bottom' className='font-medium text-xs'>
            {getTooltipMessage('Duplicate Block')}
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              if (!disabled) {
                collaborativeRemoveBlock(blockId)
              }
            }}
            className={cn(
              'h-8 w-8 rounded-full p-0 transition-all duration-200',
              'border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm',
              'text-red-500 hover:border-red-400/30 hover:bg-red-500/20 hover:text-red-400',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            disabled={disabled}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='font-medium text-xs'>
          {getTooltipMessage('Delete Block')}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
