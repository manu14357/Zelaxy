'use client'

import { motion } from 'framer-motion'
import { getBaseUrl } from '@/lib/urls/utils'

export default function HeaderLinks() {
  return (
    <div className='flex items-center'>
      <motion.a
        href={`${getBaseUrl()}/`}
        className='flex items-center gap-1.5 rounded-md p-1 text-foreground/80 transition-colors duration-200 hover:text-foreground/100'
        title='Powered by Zelaxy'
        target='_blank'
        rel='noopener noreferrer'
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
      >
        <div className='flex h-6 w-6 items-center justify-center rounded-md bg-primary'>
          <img src='/Zelaxy.png' alt='Zelaxy' width={16} height={16} className='h-4 w-4' />
        </div>
        <span className='hidden font-medium text-sm sm:inline'>Zelaxy</span>
      </motion.a>
    </div>
  )
}
