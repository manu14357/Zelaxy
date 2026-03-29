'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingAgent } from '@/components/ui/loading-agent'
import { useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('ArenaPage')

export default function ArenaPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    const redirectToFirstArena = async () => {
      // Wait for session to load
      if (isPending) {
        return
      }

      // If user is not authenticated, redirect to login
      if (!session?.user) {
        logger.info('User not authenticated, redirecting to login')
        router.replace('/login')
        return
      }

      try {
        // Auto-accept any pending organization invitations for this user
        try {
          await fetch('/api/organizations/invitations/auto-accept', { method: 'POST' })
        } catch {
          // Non-critical — continue even if auto-accept fails
        }

        // Check if we need to redirect a specific workflow from old URL format
        const urlParams = new URLSearchParams(window.location.search)
        const redirectWorkflowId = urlParams.get('redirect_workflow')

        if (redirectWorkflowId) {
          // Try to get the arena for this workflow
          try {
            const workflowResponse = await fetch(`/api/workflows/${redirectWorkflowId}`)
            if (workflowResponse.ok) {
              const workflowData = await workflowResponse.json()
              const workspaceId = workflowData.data?.workspaceId

              if (workspaceId) {
                logger.info(`Redirecting workflow ${redirectWorkflowId} to arena ${workspaceId}`)
                router.replace(`/arena/${workspaceId}/zelaxy/${redirectWorkflowId}`)
                return
              }
            }
          } catch (error) {
            logger.error('Error fetching workflow for redirect:', error)
          }
        }

        // Fetch user's arenas
        const response = await fetch('/api/arenas')

        if (response.status === 401) {
          logger.warn('Session invalid or user deleted, redirecting to login')
          router.replace('/login')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch arenas')
        }

        const data = await response.json()
        const arenas = data.workspaces || []

        if (arenas.length === 0) {
          logger.warn('No arenas found for user, creating default arena')

          try {
            const createResponse = await fetch('/api/arenas', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: 'My Arena' }),
            })

            if (createResponse.ok) {
              const createData = await createResponse.json()
              const newArena = createData.workspace

              if (newArena?.id) {
                logger.info(`Created default arena: ${newArena.id}`)
                router.replace(`/arena/${newArena.id}/zelaxy`)
                return
              }
            }

            logger.error('Failed to create default arena')
          } catch (createError) {
            logger.error('Error creating default arena:', createError)
          }

          // If we can't create an arena, redirect to login to reset state
          router.replace('/login')
          return
        }

        // Get the first arena (they should be ordered by most recent)
        const firstArena = arenas[0]
        logger.info(`Redirecting to first arena: ${firstArena.id}`)

        // Redirect to the first arena
        router.replace(`/arena/${firstArena.id}/zelaxy`)
      } catch (error) {
        logger.error('Error fetching arenas for redirect:', error)
        // Redirect to login to reset session state
        router.replace('/login')
      }
    }

    // Only run this logic when we're at the root /arena path
    // If we're already in a specific arena, the children components will handle it
    if (typeof window !== 'undefined' && window.location.pathname === '/arena') {
      redirectToFirstArena()
    }
  }, [session, isPending, router])

  // Show loading state while we determine where to redirect
  if (isPending) {
    return (
      <div className='flex h-screen w-full items-center justify-center'>
        <div className='flex flex-col items-center justify-center text-center align-middle'>
          <LoadingAgent size='lg' />
        </div>
      </div>
    )
  }

  // If user is not authenticated, show nothing (redirect will happen)
  if (!session?.user) {
    return null
  }

  return null
}
