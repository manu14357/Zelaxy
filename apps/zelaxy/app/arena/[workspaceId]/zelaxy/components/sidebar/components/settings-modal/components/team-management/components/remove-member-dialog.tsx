import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface RemoveMemberDialogProps {
  open: boolean
  memberName: string
  shouldReduceSeats: boolean
  onOpenChange: (open: boolean) => void
  onShouldReduceSeatsChange: (shouldReduce: boolean) => void
  onConfirmRemove: (shouldReduceSeats: boolean) => Promise<void>
  onCancel: () => void
}

export function RemoveMemberDialog({
  open,
  memberName,
  shouldReduceSeats,
  onOpenChange,
  onShouldReduceSeatsChange,
  onConfirmRemove,
  onCancel,
}: RemoveMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-[15px]'>Remove Team Member</DialogTitle>
          <DialogDescription className='text-[13px]'>
            Are you sure you want to remove {memberName} from the team?
          </DialogDescription>
        </DialogHeader>

        <div className='py-3'>
          <label className='flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-muted/50'>
            <input
              type='checkbox'
              id='reduce-seats'
              className='h-4 w-4 rounded border-border/60 accent-primary'
              checked={shouldReduceSeats}
              onChange={(e) => onShouldReduceSeatsChange(e.target.checked)}
            />
            <div>
              <span className='font-medium text-[13px] text-foreground'>
                Also reduce seat count in my subscription
              </span>
              <p className='mt-0.5 text-[11px] text-muted-foreground'>
                Your team seat count will be reduced by 1, lowering your monthly billing.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter className='gap-2 sm:gap-2'>
          <Button
            variant='outline'
            onClick={onCancel}
            size='sm'
            className='h-8 rounded-lg text-[13px]'
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={() => onConfirmRemove(shouldReduceSeats)}
            size='sm'
            className='h-8 rounded-lg text-[13px]'
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
