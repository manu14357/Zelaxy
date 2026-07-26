import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PLAN_TIER_DEFAULTS } from '@/lib/billing/plan-defaults'
import { RAZORPAY_PLAN_PRICING } from '@/lib/billing/razorpay-pricing'

interface TeamSeatsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  currentSeats?: number
  initialSeats?: number
  isLoading: boolean
  onConfirm: (seats: number) => Promise<void>
  confirmButtonText: string
  showCostBreakdown?: boolean
}

export function TeamSeatsDialog({
  open,
  onOpenChange,
  title,
  description,
  currentSeats,
  initialSeats = 1,
  isLoading,
  onConfirm,
  confirmButtonText,
  showCostBreakdown = false,
}: TeamSeatsDialogProps) {
  const [selectedSeats, setSelectedSeats] = useState(initialSeats)

  useEffect(() => {
    if (open) {
      setSelectedSeats(initialSeats)
    }
  }, [open, initialSeats])

  // pricePerSeat is what Razorpay actually charges; creditsPerSeat is the
  // internal usage-metering budget included per seat - two different
  // numeric domains, see lib/billing/razorpay-pricing.ts.
  const pricePerSeat = RAZORPAY_PLAN_PRICING.team.priceInr
  const creditsPerSeat = PLAN_TIER_DEFAULTS.team.defaultMinimumCost
  const totalMonthlyPrice = selectedSeats * pricePerSeat
  const priceChange = currentSeats ? (selectedSeats - currentSeats) * pricePerSeat : 0

  const handleConfirm = async () => {
    await onConfirm(selectedSeats)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <Label htmlFor='seats'>Number of seats</Label>
          <Select
            value={selectedSeats.toString()}
            onValueChange={(value) => setSelectedSeats(Number.parseInt(value))}
          >
            <SelectTrigger id='seats'>
              <SelectValue placeholder='Select number of seats' />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'seat' : 'seats'} (₹{num * pricePerSeat}/month)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className='mt-2 text-muted-foreground text-sm'>
            Your team will have {selectedSeats} {selectedSeats === 1 ? 'seat' : 'seats'} for ₹
            {totalMonthlyPrice}/month, with ${selectedSeats * creditsPerSeat} in inference credits
            included.
          </p>

          {showCostBreakdown && currentSeats !== undefined && (
            <div className='mt-3 rounded-md bg-muted/50 p-3'>
              <div className='flex justify-between text-sm'>
                <span>Current seats:</span>
                <span>{currentSeats}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span>New seats:</span>
                <span>{selectedSeats}</span>
              </div>
              <div className='mt-2 flex justify-between border-t pt-2 font-medium text-sm'>
                <span>Monthly cost change:</span>
                <span>
                  {priceChange > 0 ? '+' : ''}₹{priceChange}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (showCostBreakdown && selectedSeats === currentSeats)}
          >
            {isLoading ? (
              <div className='flex items-center space-x-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-b-transparent' />
                <span>Loading...</span>
              </div>
            ) : (
              <span>{confirmButtonText}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
