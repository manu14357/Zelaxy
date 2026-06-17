'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TableDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-4 p-8'>
      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10'>
        <AlertCircle className='h-6 w-6 text-destructive' />
      </div>
      <div className='text-center'>
        <h2 className='font-semibold text-foreground text-lg'>Failed to load table</h2>
        <p className='mt-1 text-muted-foreground text-sm'>{error.message}</p>
      </div>
      <Button variant='outline' onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
