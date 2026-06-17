import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_ROW_COUNT = 6

export default function TablesLoading() {
  return (
    <div className='flex h-full flex-col'>
      <div className='border-border/50 border-b bg-card/30 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-9 w-9 rounded-xl' />
            <div>
              <Skeleton className='h-4 w-24 rounded' />
              <Skeleton className='mt-1.5 h-3 w-48 rounded' />
            </div>
          </div>
          <Skeleton className='h-8 w-28 rounded-lg' />
        </div>
      </div>
      <div className='flex-1 overflow-auto px-6 py-5'>
        <div className='mb-4 flex items-center gap-3'>
          <Skeleton className='h-9 flex-1 rounded-lg' />
          <Skeleton className='h-9 w-32 rounded-lg' />
          <Skeleton className='h-9 w-9 rounded-lg' />
        </div>
        <div className='overflow-hidden rounded-xl border border-border/40'>
          <div className='border-border/40 border-b bg-muted/30 px-4 py-2.5'>
            <div className='grid grid-cols-4 gap-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-3 w-20 rounded' />
              ))}
            </div>
          </div>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <div key={i} className='border-border/30 border-b px-4 py-3 last:border-0'>
              <div className='grid grid-cols-4 gap-4'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-4 rounded' />
                  <Skeleton className='h-4 w-32 rounded' />
                </div>
                <Skeleton className='h-4 w-16 rounded' />
                <Skeleton className='h-4 w-16 rounded' />
                <Skeleton className='h-4 w-24 rounded' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
