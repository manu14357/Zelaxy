'use client'

import { useMemo, useState } from 'react'
import { BookOpen, Database, FileText, LibraryBig, Plus, Search, Sparkles } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BaseOverview,
  CreateModal,
  KnowledgeBaseCardSkeletonGrid,
  PrimaryButton,
  SearchInput,
} from '@/app/arena/[workspaceId]/knowledge/components'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import { useKnowledgeBasesList } from '@/hooks/use-knowledge'
import type { KnowledgeBaseData } from '@/stores/knowledge/store'

interface KnowledgeBaseWithDocCount extends KnowledgeBaseData {
  docCount?: number
}

export function Knowledge() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const { knowledgeBases, isLoading, error, addKnowledgeBase, refreshList } =
    useKnowledgeBasesList(workspaceId)
  const userPermissions = useUserPermissionsContext()

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleKnowledgeBaseCreated = (newKnowledgeBase: KnowledgeBaseData) => {
    addKnowledgeBase(newKnowledgeBase)
  }

  const handleRetry = () => {
    refreshList()
  }

  const filteredKnowledgeBases = useMemo(() => {
    if (!searchQuery.trim()) return knowledgeBases

    const query = searchQuery.toLowerCase()
    return knowledgeBases.filter(
      (kb) => kb.name.toLowerCase().includes(query) || kb.description?.toLowerCase().includes(query)
    )
  }, [knowledgeBases, searchQuery])

  const formatKnowledgeBaseForDisplay = (kb: KnowledgeBaseWithDocCount) => ({
    id: kb.id,
    title: kb.name,
    docCount: kb.docCount || 0,
    description: kb.description || 'No description available',
  })

  const totalDocs = useMemo(() => {
    return knowledgeBases.reduce(
      (sum, kb) => sum + ((kb as KnowledgeBaseWithDocCount).docCount || 0),
      0
    )
  }, [knowledgeBases])

  return (
    <>
      <div className='flex h-full flex-col'>
        {/* Compact Header Bar */}
        <div className='border-border/50 border-b bg-card/30 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
                <BookOpen className='h-4 w-4 text-primary' />
              </div>
              <div>
                <h1 className='font-semibold text-[15px] text-foreground leading-none'>
                  Knowledge Hub
                </h1>
                <p className='mt-1 text-[12px] text-muted-foreground'>
                  Transform documents into intelligent knowledge for your AI agents
                </p>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <PrimaryButton
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={userPermissions.canEdit !== true}
                  className='gap-1.5 rounded-lg bg-primary px-4 py-2 font-medium text-[12px] text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md'
                >
                  <Plus className='h-3.5 w-3.5' />
                  <span>New Knowledge Base</span>
                </PrimaryButton>
              </TooltipTrigger>
              {userPermissions.canEdit !== true && (
                <TooltipContent>Write access required to create knowledge bases</TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 overflow-auto'>
          <div className='px-6 py-5'>
            {/* Stats Strip */}
            {!isLoading && knowledgeBases.length > 0 && (
              <div className='mb-5 grid grid-cols-3 gap-3'>
                <div className='rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                      <Database className='h-3.5 w-3.5 text-primary' />
                    </div>
                    <div>
                      <div className='font-semibold text-[16px] text-foreground tabular-nums leading-none'>
                        {knowledgeBases.length}
                      </div>
                      <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
                        Knowledge Bases
                      </div>
                    </div>
                  </div>
                </div>

                <div className='rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10'>
                      <FileText className='h-3.5 w-3.5 text-blue-500' />
                    </div>
                    <div>
                      <div className='font-semibold text-[16px] text-foreground tabular-nums leading-none'>
                        {totalDocs}
                      </div>
                      <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
                        Total Documents
                      </div>
                    </div>
                  </div>
                </div>

                <div className='rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-200 hover:border-border/60 hover:shadow-sm'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10'>
                      <Sparkles className='h-3.5 w-3.5 text-emerald-500' />
                    </div>
                    <div>
                      <div className='font-semibold text-[16px] text-foreground tabular-nums leading-none'>
                        Active
                      </div>
                      <div className='mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider'>
                        Status
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className='mb-5'>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder='Search knowledge bases by name or description...'
                className='w-full'
              />
            </div>

            {/* Error State */}
            {error && (
              <div className='mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4'>
                <div className='flex items-start gap-3'>
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10'>
                    <span className='text-red-500 text-sm'>!</span>
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-[13px] text-foreground'>
                      Failed to load knowledge bases
                    </h3>
                    <p className='mt-1 text-[12px] text-muted-foreground'>{error}</p>
                    <button
                      onClick={handleRetry}
                      className='mt-2 rounded-lg bg-red-500/10 px-3 py-1 font-medium text-[12px] text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400'
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            {isLoading ? (
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <div className='h-4 w-28 animate-pulse rounded-md bg-muted/60' />
                </div>
                <KnowledgeBaseCardSkeletonGrid count={8} />
              </div>
            ) : (
              <>
                {/* Count label */}
                {knowledgeBases.length > 0 && (
                  <div className='mb-4 flex items-center gap-2'>
                    <span className='font-medium text-[12px] text-muted-foreground'>
                      {filteredKnowledgeBases.length}{' '}
                      {filteredKnowledgeBases.length === 1 ? 'base' : 'bases'}
                      {searchQuery && (
                        <span className='text-muted-foreground/60'>
                          {' '}
                          matching &ldquo;{searchQuery}&rdquo;
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Knowledge Base Grid */}
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {filteredKnowledgeBases.length === 0 ? (
                    knowledgeBases.length === 0 ? (
                      /* Empty state — no bases at all */
                      <div className='col-span-full'>
                        <div className='flex flex-col items-center rounded-xl border border-border/60 border-dashed bg-card/30 px-6 py-16'>
                          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10'>
                            <LibraryBig className='h-7 w-7 text-primary' />
                          </div>
                          <h3 className='mt-5 font-semibold text-[15px] text-foreground'>
                            Create your first knowledge base
                          </h3>
                          <p className='mt-2 max-w-sm text-center text-[13px] text-muted-foreground leading-relaxed'>
                            {userPermissions.canEdit === true
                              ? 'Upload documents and transform them into intelligent knowledge your AI agents can access.'
                              : 'Knowledge bases will appear here once created. Contact an admin for access.'}
                          </p>
                          <PrimaryButton
                            onClick={
                              userPermissions.canEdit === true
                                ? () => setIsCreateModalOpen(true)
                                : () => {}
                            }
                            disabled={userPermissions.canEdit !== true}
                            className='mt-5 gap-1.5 rounded-lg bg-primary px-5 py-2 font-medium text-[12px] text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90'
                          >
                            <Plus className='h-3.5 w-3.5' />
                            <span>
                              {userPermissions.canEdit === true ? 'Get Started' : 'Request Access'}
                            </span>
                          </PrimaryButton>
                        </div>
                      </div>
                    ) : (
                      /* Empty state — search returned nothing */
                      <div className='col-span-full'>
                        <div className='flex flex-col items-center rounded-xl border border-border/60 border-dashed bg-card/30 px-6 py-12'>
                          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50'>
                            <Search className='h-5 w-5 text-muted-foreground' />
                          </div>
                          <h3 className='mt-4 font-semibold text-[14px] text-foreground'>
                            No results found
                          </h3>
                          <p className='mt-1 text-[12px] text-muted-foreground'>
                            Try adjusting your search terms
                          </p>
                          <button
                            onClick={() => setSearchQuery('')}
                            className='mt-3 rounded-lg bg-muted/50 px-3 py-1 font-medium text-[12px] text-foreground transition-colors hover:bg-muted'
                          >
                            Clear search
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    filteredKnowledgeBases.map((kb) => {
                      const displayData = formatKnowledgeBaseForDisplay(
                        kb as KnowledgeBaseWithDocCount
                      )
                      return (
                        <BaseOverview
                          key={kb.id}
                          id={displayData.id}
                          title={displayData.title}
                          docCount={displayData.docCount}
                          description={displayData.description}
                        />
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <CreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onKnowledgeBaseCreated={handleKnowledgeBaseCreated}
      />
    </>
  )
}
