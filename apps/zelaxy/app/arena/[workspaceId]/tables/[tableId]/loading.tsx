import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_ROW_COUNT = 8
const COLUMN_COUNT = 5

export default function TableDetailLoading() {
  return (
    <div className='flex h-full flex-1 flex-col overflow-hidden'>
      {/* Toolbar */}
      <div className='border-b border-border/50 px-4 py-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-3.5 w-3.5 rounded' />
            <Skeleton className='h-3.5 w-11 rounded' />
            <Skeleton className='h-3.5 w-2 rounded' />
            <Skeleton className='h-3.5 w-24 rounded' />
          </div>
          <div className='flex items-center gap-1.5'>
            <Skeleton className='h-7 w-20 rounded-md' />
            <Skeleton className='h-7 w-20 rounded-md' />
          </div>
        </div>
      </div>
      {/* Grid */}
      <div className='min-h-0 flex-1 overflow-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-border/40'>
              {Array.from({ length: COLUMN_COUNT }).map((_, i) => (
                <th key={i} className='px-3 py-2 text-left'>
                  <Skeleton className='h-3 w-18 rounded' />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROW_COUNT }).map((_, r) => (
              <tr key={r} className='border-b border-border/30'>
                {Array.from({ length: COLUMN_COUNT }).map((_, c) => (
                  <td key={c} className='px-3 py-2'>
                    <Skeleton className='h-3 w-full rounded' style={{ maxWidth: `${60 + Math.random() * 80}px` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
