'use client'

import { motion } from 'framer-motion'

export default function HeaderLinks() {
  return (
    <div className='flex items-center'>
      <motion.a
        href='http://localhost:3000/'
        className='flex items-center gap-1.5 rounded-md p-1 text-foreground/80 transition-colors duration-200 hover:text-foreground/100'
        title='Powered by Zelaxy'
        target='_blank'
        rel='noopener noreferrer'
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
      >
        <div className='flex h-6 w-6 items-center justify-center rounded-md bg-primary'>
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
        <span className='hidden font-medium text-sm sm:inline'>Zelaxy</span>
      </motion.a>
    </div>
  )
}
