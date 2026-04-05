'use client'

import { getBaseUrl } from '@/lib/urls/utils'

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
          <div className='flex h-12 w-12 items-center justify-center'>
            <img src='/Zelaxy.png' alt='Zelaxy' width={28} height={28} className='h-7 w-7' />
          </div>
        )}
        <h2 className='font-medium text-lg'>
          {chatConfig?.customizations?.headerText || chatConfig?.title || 'Chat'}
        </h2>
      </div>
      <div className='flex items-center gap-2'>
        <a
          href={`${getBaseUrl()}/`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center rounded-md p-1 text-foreground/80 transition-colors duration-200 hover:text-foreground/100'
          title='Powered by Zelaxy'
        >
          <div className='flex h-7 w-7 items-center justify-center rounded-md bg-primary'>
            <img src='/Zelaxy.png' alt='Zelaxy' width={16} height={16} className='h-4 w-4' />
          </div>
        </a>
      </div>
    </div>
  )
}
