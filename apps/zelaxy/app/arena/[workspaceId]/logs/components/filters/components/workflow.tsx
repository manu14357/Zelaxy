import { useEffect, useState } from 'react'
import {
  Bird,
  Cat,
  Check,
  ChevronDown,
  Crown,
  Dog,
  Fish,
  Gem,
  Globe,
  Heart,
  Moon,
  Orbit,
  Rabbit,
  Rocket,
  Sparkles,
  Squirrel,
  Star,
  Sun,
  Turtle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFilterStore } from '@/stores/logs/filters/store'

// Space/Galaxy themed icons plus animals and birds
const spaceIcons = [
  Star,
  Sparkles,
  Zap,
  Rocket,
  Globe,
  Moon,
  Sun,
  Orbit,
  Heart,
  Crown,
  Gem,
  Bird,
  Fish,
  Rabbit,
  Cat,
  Dog,
  Squirrel,
  Turtle,
]

// Function to get a consistent space icon based on workflow ID
function getSpaceIcon(workflowId: string) {
  // Create a simple hash from the workflow ID to ensure consistency
  let hash = 0
  for (let i = 0; i < workflowId.length; i++) {
    const char = workflowId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % spaceIcons.length
  return spaceIcons[index]
}

// Helper function to lighten a hex color
function lightenColor(hex: string, percent = 30): string {
  // Remove # if present
  const color = hex.replace('#', '')

  // Parse RGB values
  const num = Number.parseInt(color, 16)
  const r = Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent) / 100))
  const g = Math.min(
    255,
    Math.floor(((num >> 8) & 0x00ff) + ((255 - ((num >> 8) & 0x00ff)) * percent) / 100)
  )
  const b = Math.min(255, Math.floor((num & 0x0000ff) + ((255 - (num & 0x0000ff)) * percent) / 100))

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

interface WorkflowOption {
  id: string
  name: string
  color: string
}

export default function Workflow() {
  const { workflowIds, toggleWorkflowId, setWorkflowIds } = useFilterStore()
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all available workflows from the API
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/workflows/sync')
        if (response.ok) {
          const { data } = await response.json()
          const workflowOptions: WorkflowOption[] = data.map((workflow: any) => ({
            id: workflow.id,
            name: workflow.name,
            color: workflow.color || '#3972F6',
          }))
          setWorkflows(workflowOptions)
        }
      } catch (error) {
        console.error('Failed to fetch workflows:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [])

  // Get display text for the dropdown button
  const getSelectedWorkflowsText = () => {
    if (workflowIds.length === 0) return 'All workflows'
    if (workflowIds.length === 1) {
      const selected = workflows.find((w) => w.id === workflowIds[0])
      return selected ? selected.name : 'All workflows'
    }
    return `${workflowIds.length} workflows selected`
  }

  // Check if a workflow is selected
  const isWorkflowSelected = (workflowId: string) => {
    return workflowIds.includes(workflowId)
  }

  // Clear all selections
  const clearSelections = () => {
    setWorkflowIds([])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='w-full justify-between rounded-[10px] border-border bg-background font-normal text-sm dark:border-border dark:bg-card'
        >
          {loading ? 'Loading workflows...' : getSelectedWorkflowsText()}
          <ChevronDown className='ml-2 h-4 w-4 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className='max-h-[300px] w-[180px] overflow-y-auto rounded-lg border-border bg-background shadow-xs dark:border-border dark:bg-card'
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <DropdownMenuItem
          key='all'
          onSelect={(e) => {
            e.preventDefault()
            clearSelections()
          }}
          className='flex cursor-pointer items-center justify-between rounded-md px-3 py-2 font-[380] text-card-foreground text-sm hover:bg-secondary/50 focus:bg-secondary/50'
        >
          <span>All workflows</span>
          {workflowIds.length === 0 && <Check className='h-4 w-4 text-primary' />}
        </DropdownMenuItem>

        {!loading && workflows.length > 0 && <DropdownMenuSeparator />}

        {!loading &&
          workflows.map((workflow) => {
            const SpaceIcon = getSpaceIcon(workflow.id)
            return (
              <DropdownMenuItem
                key={workflow.id}
                onSelect={(e) => {
                  e.preventDefault()
                  toggleWorkflowId(workflow.id)
                }}
                className='flex cursor-pointer items-center justify-between rounded-md px-3 py-2 font-[380] text-card-foreground text-sm hover:bg-secondary/50 focus:bg-secondary/50'
              >
                <div className='flex items-center'>
                  <SpaceIcon className='mr-2 h-3 w-3' style={{ color: workflow.color }} />
                  {workflow.name}
                </div>
                {isWorkflowSelected(workflow.id) && <Check className='h-4 w-4 text-primary' />}
              </DropdownMenuItem>
            )
          })}

        {loading && (
          <DropdownMenuItem
            disabled
            className='rounded-md px-3 py-2 font-[380] text-muted-foreground text-sm'
          >
            Loading workflows...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
