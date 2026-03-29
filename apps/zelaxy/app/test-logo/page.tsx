'use client'

import { LoadingAgent } from '@/components/ui/loading-agent'

export default function TestLogoPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-8 dark:from-gray-900 dark:to-gray-800'>
      <div className='space-y-8 text-center'>
        <h1 className='mb-8 font-bold text-4xl text-gray-900 dark:text-white'>
          Robot Agent Loading Animation
        </h1>

        {/* Different sizes showcase */}
        <div className='grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3'>
          {/* Small size */}
          <div className='rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800'>
            <h3 className='mb-4 font-semibold text-gray-800 text-lg dark:text-gray-200'>
              Small (sm)
            </h3>
            <div className='mb-4 flex justify-center'>
              <LoadingAgent size='sm' />
            </div>
            <p className='text-gray-600 text-sm dark:text-gray-400'>
              24x24 pixels - Perfect for inline loading (5px stroke)
            </p>
          </div>

          {/* Medium size */}
          <div className='rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800'>
            <h3 className='mb-4 font-semibold text-gray-800 text-lg dark:text-gray-200'>
              Medium (md)
            </h3>
            <div className='mb-4 flex justify-center'>
              <LoadingAgent size='md' />
            </div>
            <p className='text-gray-600 text-sm dark:text-gray-400'>
              32x32 pixels - Default size for most use cases (5px stroke)
            </p>
          </div>

          {/* Large size */}
          <div className='rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800'>
            <h3 className='mb-4 font-semibold text-gray-800 text-lg dark:text-gray-200'>
              Large (lg)
            </h3>
            <div className='mb-4 flex justify-center'>
              <LoadingAgent size='lg' />
            </div>
            <p className='text-gray-600 text-sm dark:text-gray-400'>
              48x48 pixels - Great for prominent loading states (5px stroke)
            </p>
          </div>
        </div>

        {/* Animation details */}
        <div className='max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'>
          <h3 className='mb-4 font-semibold text-gray-800 text-xl dark:text-gray-200'>
            Animation Sequence
          </h3>
          <div className='space-y-2 text-left text-gray-600 dark:text-gray-400'>
            <p>
              • <strong>Structure:</strong> M-shaped robot head with 5px stroke thickness
            </p>
            <p>
              • <strong>Elements:</strong> Antenna tip (r=4), eyes (r=4), thick smile curve
            </p>
            <p>
              • <strong>0s:</strong> Antenna tip circle and line draw from top
            </p>
            <p>
              • <strong>0.2s:</strong> V-shape peaks draw simultaneously from center
            </p>
            <p>
              • <strong>0.4s:</strong> Both sides flow down to bottom, meeting at center
            </p>
            <p>
              • <strong>Simultaneous:</strong> Eyes and smile appear with main flow
            </p>
            <p>
              • <strong>Loop:</strong> 4-second cycle repeats infinitely
            </p>
          </div>
        </div>

        {/* Usage examples */}
        <div className='max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'>
          <h3 className='mb-4 font-semibold text-gray-800 text-xl dark:text-gray-200'>
            Usage Examples
          </h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Loading message example */}
            <div className='flex items-center space-x-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700'>
              <LoadingAgent size='sm' />
              <span className='text-gray-700 dark:text-gray-300'>Loading workflow...</span>
            </div>

            {/* Button loading example */}
            <div className='flex items-center justify-center space-x-3 rounded-lg bg-primary/10 p-4 dark:bg-primary/15/20'>
              <LoadingAgent size='sm' />
              <span className='text-primary dark:text-primary/70'>Deploying...</span>
            </div>

            {/* Card loading example */}
            <div className='flex flex-col items-center space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-700'>
              <LoadingAgent size='md' />
              <span className='text-gray-700 text-sm dark:text-gray-300'>Loading templates</span>
            </div>

            {/* Full page loading example */}
            <div className='flex flex-col items-center space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-700'>
              <LoadingAgent size='lg' />
              <span className='text-gray-700 text-sm dark:text-gray-300'>
                Initializing workspace
              </span>
            </div>
          </div>
        </div>

        {/* Go back link */}
        <div className='pt-8'>
          <a
            href='/workspace'
            className='inline-flex items-center rounded-md border border-transparent bg-primary px-6 py-3 font-medium text-base text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          >
            ← Back to Workspace
          </a>
        </div>
      </div>
    </div>
  )
}
