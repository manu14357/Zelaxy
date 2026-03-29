'use client'

interface ChatHeaderProps {
  chatConfig: {
    title?: string
    customizations?: {
      headerText?: string
      logoUrl?: string
      imageUrl?: string
      primaryColor?: string
    }
  } | null
  starCount?: string
}

export function ChatHeader({ chatConfig }: ChatHeaderProps) {
  const primaryColor = chatConfig?.customizations?.primaryColor || '#F97316'
  const customImage = chatConfig?.customizations?.imageUrl || chatConfig?.customizations?.logoUrl

  return (
    <div className='flex items-center justify-between bg-background/95 px-6 py-4 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-8 md:pt-4'>
      <div className='flex items-center gap-4'>
        {customImage ? (
          <img
            src={customImage}
            alt={`${chatConfig?.title || 'Chat'} logo`}
            className='h-12 w-12 rounded-md object-cover'
          />
        ) : (
          // Default Zelaxy logo when no custom image is provided
          <div className='flex h-12 w-12 items-center justify-center rounded-md bg-primary'>
            <svg
              width='24'
              height='24'
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
        )}
        <h2 className='font-medium text-lg'>
          {chatConfig?.customizations?.headerText || chatConfig?.title || 'Chat'}
        </h2>
      </div>
      <div className='flex items-center gap-2'>
        <a
          href='http://localhost:3000/'
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center rounded-md p-1 text-foreground/80 transition-colors duration-200 hover:text-foreground/100'
          title='Powered by Zelaxy'
        >
          <div className='flex h-7 w-7 items-center justify-center rounded-md bg-primary'>
            <svg
              width='16'
              height='16'
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
    </div>
  )
}
