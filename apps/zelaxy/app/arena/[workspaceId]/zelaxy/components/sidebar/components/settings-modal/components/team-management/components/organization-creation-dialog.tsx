import { RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface OrganizationCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgName: string
  onOrgNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  orgSlug: string
  onOrgSlugChange: (slug: string) => void
  onCreateOrganization: () => Promise<void>
  isCreating: boolean
  error: string | null
}

export function OrganizationCreationDialog({
  open,
  onOpenChange,
  orgName,
  onOrgNameChange,
  orgSlug,
  onOrgSlugChange,
  onCreateOrganization,
  isCreating,
  error,
}: OrganizationCreationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-[15px]'>Create Team Workspace</DialogTitle>
          <DialogDescription className='text-[13px]'>
            Create a workspace for your team to collaborate on projects.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-3'>
          <div className='space-y-1.5'>
            <label htmlFor='orgName' className='font-medium text-[12px] text-foreground'>
              Team Name
            </label>
            <Input
              id='orgName'
              value={orgName}
              onChange={onOrgNameChange}
              placeholder='My Team'
              className='h-9 rounded-lg text-[13px]'
            />
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='orgSlug' className='font-medium text-[12px] text-foreground'>
              Team Slug
            </label>
            <Input
              value={orgSlug}
              onChange={(e) => onOrgSlugChange(e.target.value)}
              placeholder='my-team'
              className='h-9 rounded-lg text-[13px]'
            />
          </div>
        </div>

        {error && (
          <Alert variant='destructive' className='rounded-lg border-destructive/40'>
            <AlertTitle className='text-[13px]'>Error</AlertTitle>
            <AlertDescription className='text-[12px]'>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className='gap-2 sm:gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            size='sm'
            className='h-8 rounded-lg text-[13px]'
          >
            Cancel
          </Button>
          <Button
            onClick={onCreateOrganization}
            disabled={!orgName || !orgSlug || isCreating}
            size='sm'
            className='h-8 rounded-lg text-[13px]'
          >
            {isCreating && <RefreshCw className='mr-1.5 h-3.5 w-3.5 animate-spin' />}
            Create Team Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
