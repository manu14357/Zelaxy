'use client'

interface ChatErrorStateProps {
  error: string
  starCount?: string
}

export function ChatErrorState({ error, starCount = '3.4k' }: ChatErrorStateProps) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='mx-auto max-w-md rounded-xl bg-white p-6 shadow-md'>
        <div className='mb-2 flex items-center justify-between'>
          <a href='http://localhost:3000/' target='_blank' rel='noopener noreferrer'>
            <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary'>
              <svg
                width='20'
                height='20'
                viewBox='0 0 100 100'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='text-white'
              >
                <circle cx='50' cy='15' r='4' stroke='currentColor' strokeWidth='5' fill='none' />
                <path
                  d='M50 15 L50 40'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M50 40 L35 20'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <path
                  d='M50 40 L65 20'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <path
                  d='M35 20 L20 45 L20 75 Q20 82 30 85 L50 85'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <path
                  d='M65 20 L80 45 L80 75 Q80 82 70 85 L50 85'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <circle cx='40' cy='55' r='4' fill='currentColor' />
                <circle cx='60' cy='55' r='4' fill='currentColor' />
                <path
                  d='M40 68 Q50 76 60 68'
                  stroke='currentColor'
                  strokeWidth='5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
              </svg>
            </div>
          </a>
        </div>
        <h2 className='mb-2 font-bold text-red-500 text-xl'>Error</h2>
        <p className='text-gray-700'>{error}</p>
      </div>
    </div>
  )
}
