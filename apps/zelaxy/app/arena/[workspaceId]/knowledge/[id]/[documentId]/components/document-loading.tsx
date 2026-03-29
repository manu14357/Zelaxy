'use client'

import { Plus, Search } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChunkTableSkeleton, KnowledgeHeader } from '@/app/arena/[workspaceId]/knowledge/components'

interface DocumentLoadingProps {
  knowledgeBaseId: string
  knowledgeBaseName: string
  documentName: string
}

export function DocumentLoading({
  knowledgeBaseId,
  knowledgeBaseName,
  documentName,
}: DocumentLoadingProps) {
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  const breadcrumbs = [
    {
      id: 'knowledge-root',
      label: 'Knowledge Hub',
      href: `/arena/${workspaceId}/hub?tab=knowledge`,
    },
    {
      id: `knowledge-base-${knowledgeBaseId}`,
      label: knowledgeBaseName,
      href: `/arena/${workspaceId}/knowledge/${knowledgeBaseId}`,
    },
    {
      id: `document-${knowledgeBaseId}-${documentName}`,
      label: documentName,
    },
  ]

  return (
    <div className='flex h-screen flex-col bg-gradient-to-br from-background to-muted/20'>
      {/* Header with Breadcrumbs */}
      <KnowledgeHeader breadcrumbs={breadcrumbs} />

      <div className='flex flex-1 overflow-hidden'>
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Main Content */}
          <div className='flex-1 overflow-auto'>
            <div className='px-6 pb-8'>
              {/* Search Section */}
              <div className='mb-6 flex items-center justify-between pt-2'>
                <div className='relative max-w-md'>
                  <div className='relative flex items-center'>
                    <Search className='-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px] transform text-muted-foreground' />
                    <input
                      type='text'
                      placeholder='Search document chunks...'
                      disabled
                      className='h-10 w-full rounded-md border bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    />
                  </div>
                </div>

                <Button
                  disabled
                  size='sm'
                  className='flex items-center gap-1 bg-primary font-[480] text-primary-foreground shadow-md transition-shadow duration-200 hover:bg-primary/90 hover:shadow-lg disabled:opacity-50'
                >
                  <Plus className='h-3.5 w-3.5' />
                  <span>Add Chunk</span>
                </Button>
              </div>

              {/* Table container */}
              <ChunkTableSkeleton isSidebarCollapsed={false} rowCount={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
