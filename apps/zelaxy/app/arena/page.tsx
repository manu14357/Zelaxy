'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingAgent } from '@/components/ui/loading-agent'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('ArenaPage')

export default function ArenaPage() {
  const router = useRouter()

  useEffect(() => {
    const redirectToFirstArena = async () => {
      try {
        // Check if we need to redirect a specific workflow from old URL format
        const urlParams = new URLSearchParams(window.location.search)
        const redirectWorkflowId = urlParams.get('redirect_workflow')

        // Run auto-accept and arenas fetch in parallel for faster loading
        // Middleware already verified the session, so we skip useSession() and fetch immediately
        const [, arenasResponse, workflowResponse] = await Promise.all([
          // Auto-accept any pending organization invitations (fire-and-forget)
          fetch('/api/organizations/invitations/auto-accept', { method: 'POST' }).catch(() => {}),
          // Fetch user's arenas
          fetch('/api/arenas'),
          // If redirecting a workflow, fetch it in parallel
          redirectWorkflowId
            ? fetch(`/api/workflows/${redirectWorkflowId}`).catch(() => null)
            : Promise.resolve(null),
        ])

        // Handle workflow redirect if applicable
        if (redirectWorkflowId && workflowResponse?.ok) {
          try {
            const workflowData = await workflowResponse.json()
            const workspaceId = workflowData.data?.workspaceId
            if (workspaceId) {
              logger.info(`Redirecting workflow ${redirectWorkflowId} to arena ${workspaceId}`)
              router.replace(`/arena/${workspaceId}/zelaxy/${redirectWorkflowId}`)
              return
            }
          } catch (error) {
            logger.error('Error parsing workflow redirect:', error)
          }
        }

        const response = arenasResponse

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

        // Prefetch the target route for faster navigation
        router.prefetch(`/arena/${firstArena.id}/zelaxy`)

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
  }, [router])

  // Always show loading - middleware handles auth, we're just determining where to redirect
  return (
    <div className='flex h-screen w-full items-center justify-center'>
      <div className='flex flex-col items-center justify-center text-center align-middle'>
        <LoadingAgent size='lg' />
      </div>
    </div>
  )
}
