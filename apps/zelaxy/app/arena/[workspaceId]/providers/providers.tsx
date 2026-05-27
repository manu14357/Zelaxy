'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/app/arena/[workspaceId]/providers/theme-provider'
import { WorkspacePermissionsProvider } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

const Providers = React.memo<ProvidersProps>(({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={100} skipDelayDuration={0}>
          <WorkspacePermissionsProvider>{children}</WorkspacePermissionsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
})

Providers.displayName = 'Providers'

export default Providers
