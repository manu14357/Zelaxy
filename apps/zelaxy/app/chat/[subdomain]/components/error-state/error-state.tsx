'use client'

import { getBaseUrl } from '@/lib/urls/utils'

interface ChatErrorStateProps {
  error: string
  starCount?: string
}

export function ChatErrorState({ error, starCount = '3.4k' }: ChatErrorStateProps) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='mx-auto max-w-md rounded-xl bg-white p-6 shadow-md'>
        <div className='mb-2 flex items-center justify-between'>
          <a href={`${getBaseUrl()}/`} target='_blank' rel='noopener noreferrer'>
            <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary'>
              <img src='/Zelaxy.png' alt='Zelaxy' width={20} height={20} className='h-5 w-5' />
            </div>
          </a>
        </div>
        <h2 className='mb-2 font-bold text-red-500 text-xl'>Error</h2>
        <p className='text-gray-700'>{error}</p>
      </div>
    </div>
  )
}
