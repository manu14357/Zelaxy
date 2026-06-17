'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  MoreHorizontal,
  Plus,
  Rows3,
  Search,
  Table as TableIcon,
  Upload,
  X,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createLogger } from '@/lib/logs/console/logger'
import type { TableDefinition } from '@/lib/table'
import { useUserPermissionsContext } from '@/app/arena/[workspaceId]/providers/workspace-permissions-provider'
import {
  downloadTableExport,
  useCreateTable,
  useDeleteTable,
  useTables,
  useUploadCsvToTable,
} from '@/hooks/queries/tables'
import { useDebounce } from '@/hooks/use-debounce'
import { ImportCsvDialog } from './components/import-csv-dialog'

const logger = createLogger('Tables')

type SortColumn = 'name' | 'columns' | 'rows' | 'created' | 'updated'
type SortDirection = 'asc' | 'desc'

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 60) return 'just now'
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function Tables() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string

  const userPermissions = useUserPermissionsContext()

  const { data: tables = [], isLoading } = useTables(workspaceId)
  const deleteTable = useDeleteTable()
  const createTable = useCreateTable()
  const uploadCsv = useUploadCsvToTable(workspaceId)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [activeTable, setActiveTable] = useState<TableDefinition | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: 'updated',
    direction: 'desc',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 })
  const csvInputRef = useRef<HTMLInputElement>(null)

  const processedTables = useMemo(() => {
    const result = debouncedSearchTerm
      ? tables.filter((t) => t.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      : tables

    return [...result].sort((a, b) => {
      let cmp = 0
      switch (sort.column) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'columns':
          cmp = a.schema.columns.length - b.schema.columns.length
          break
        case 'rows':
          cmp = (a.rowCount ?? 0) - (b.rowCount ?? 0)
          break
        case 'created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updated':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }
      return sort.direction === 'asc' ? cmp : -cmp
    })
  }, [tables, debouncedSearchTerm, sort])

  const handleSort = useCallback((column: SortColumn) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    )
  }, [])

  const handleRowClick = useCallback(
    (tableId: string) => {
      router.push(`/arena/${workspaceId}/tables/${tableId}`)
    },
    [router, workspaceId]
  )

  const handleDelete = async () => {
    if (!activeTable) return
    try {
      await deleteTable.mutateAsync(activeTable.id)
      setIsDeleteDialogOpen(false)
      setActiveTable(null)
    } catch (err) {
      logger.error('Failed to delete table:', err)
    }
  }

  const handleCsvChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files
      if (!list || list.length === 0 || !workspaceId) return
      try {
        setUploading(true)
        const csvFiles = Array.from(list).filter((f) => {
          const ext = f.name.split('.').pop()?.toLowerCase()
          return ext === 'csv' || ext === 'tsv'
        })
        if (csvFiles.length === 0) {
          toast.error('No CSV or TSV files selected')
          return
        }
        setUploadProgress({ completed: 0, total: csvFiles.length })
        for (let i = 0; i < csvFiles.length; i++) {
          try {
            const result = await uploadCsv.mutateAsync(csvFiles[i])
            if (csvFiles.length === 1 && result?.id) {
              router.push(`/arena/${workspaceId}/tables/${result.id}`)
            }
          } catch (err) {
            logger.error('Error uploading CSV:', err)
          } finally {
            setUploadProgress({ completed: i + 1, total: csvFiles.length })
          }
        }
      } catch (err) {
        logger.error('Error uploading CSV:', err)
      } finally {
        setUploading(false)
        setUploadProgress({ completed: 0, total: 0 })
        if (csvInputRef.current) csvInputRef.current.value = ''
      }
    },
    [workspaceId, router, uploadCsv]
  )

  const handleCreateTable = useCallback(async () => {
    const existingNames = tables.map((t) => t.name)
    const base = 'New Table'
    let name = base
    let i = 1
    while (existingNames.includes(name)) name = `${base} ${++i}`
    try {
      const result = await createTable.mutateAsync({
        name,
        workspaceId,
        schema: { columns: [{ name: 'name', type: 'string' }] },
      })
      const tableId = result?.id
      if (tableId) {
        router.push(`/arena/${workspaceId}/tables/${tableId}`)
      }
    } catch (err) {
      logger.error('Failed to create table:', err)
    }
  }, [tables, createTable, router, workspaceId])

  const uploadButtonLabel =
    uploading && uploadProgress.total > 0
      ? `${uploadProgress.completed}/${uploadProgress.total}`
      : uploading
        ? 'Uploading...'
        : undefined

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sort.column !== column) return <ArrowUpDown className='ml-1 h-3 w-3 opacity-40' />
    return sort.direction === 'asc' ? (
      <ArrowUp className='ml-1 h-3 w-3' />
    ) : (
      <ArrowDown className='ml-1 h-3 w-3' />
    )
  }

  return (
    <>
      {/* Header */}
      <div className='border-border/50 border-b bg-card/30 px-6 py-4'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
              <TableIcon className='h-4 w-4 text-primary' />
            </div>
            <div>
              <h1 className='font-semibold text-[15px] text-foreground leading-none'>Tables</h1>
              <p className='mt-1 hidden text-[12px] text-muted-foreground sm:block'>
                Store and manage structured data for your AI workflows
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={uploading || userPermissions.canEdit !== true}
                  onClick={() => csvInputRef.current?.click()}
                  className='gap-1.5'
                >
                  <Upload className='h-3.5 w-3.5' />
                  <span className='hidden sm:inline'>{uploadButtonLabel ?? 'Import CSV'}</span>
                </Button>
              </TooltipTrigger>
              {userPermissions.canEdit !== true && (
                <TooltipContent>Write access required</TooltipContent>
              )}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='sm'
                  disabled={userPermissions.canEdit !== true || createTable.isPending}
                  onClick={handleCreateTable}
                  className='gap-1.5'
                >
                  <Plus className='h-3.5 w-3.5' />
                  <span className='hidden sm:inline'>New table</span>
                </Button>
              </TooltipTrigger>
              {userPermissions.canEdit !== true && (
                <TooltipContent>Write access required</TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className='border-border/30 border-b px-6 py-3'>
        <div className='relative max-w-sm'>
          <Search className='-translate-y-1/2 absolute top-1/2 left-3 h-3.5 w-3.5 text-muted-foreground' />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Search tables...'
            className='h-8 pr-8 pl-9 text-sm'
          />
          {searchTerm && (
            <button
              type='button'
              onClick={() => setSearchTerm('')}
              className='-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground hover:text-foreground'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className='flex-1 overflow-auto px-6 py-4'>
        {isLoading ? (
          <TablesLoadingSkeleton />
        ) : tables.length === 0 ? (
          <TablesEmptyState
            onCreateTable={handleCreateTable}
            onImportCsv={() => csvInputRef.current?.click()}
            canEdit={userPermissions.canEdit === true}
          />
        ) : (
          <div className='overflow-hidden rounded-xl border border-border/40'>
            {/* Column headers */}
            <div className='grid grid-cols-[1fr_80px_80px_120px_120px_40px] items-center gap-0 border-border/40 border-b bg-muted/30 px-4 py-2'>
              <button
                type='button'
                onClick={() => handleSort('name')}
                className='flex items-center text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground'
              >
                Name <SortIcon column='name' />
              </button>
              <button
                type='button'
                onClick={() => handleSort('columns')}
                className='flex items-center text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground'
              >
                Cols <SortIcon column='columns' />
              </button>
              <button
                type='button'
                onClick={() => handleSort('rows')}
                className='flex items-center text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground'
              >
                Rows <SortIcon column='rows' />
              </button>
              <button
                type='button'
                onClick={() => handleSort('created')}
                className='flex items-center text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground'
              >
                Created <SortIcon column='created' />
              </button>
              <button
                type='button'
                onClick={() => handleSort('updated')}
                className='flex items-center text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hover:text-foreground'
              >
                Updated <SortIcon column='updated' />
              </button>
              <div />
            </div>

            {/* Rows */}
            {processedTables.length === 0 ? (
              <div className='px-4 py-10 text-center text-muted-foreground text-sm'>
                No tables match your search.
              </div>
            ) : (
              processedTables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => handleRowClick(table.id)}
                  className='grid cursor-pointer grid-cols-[1fr_80px_80px_120px_120px_40px] items-center gap-0 border-border/30 border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/30'
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <TableIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
                    <span className='truncate font-medium text-foreground text-sm'>
                      {table.name}
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5 text-muted-foreground text-sm'>
                    <Columns3 className='h-3.5 w-3.5 shrink-0' />
                    {table.schema.columns.length}
                  </div>
                  <div className='flex items-center gap-1.5 text-muted-foreground text-sm'>
                    <Rows3 className='h-3.5 w-3.5 shrink-0' />
                    {table.rowCount ?? 0}
                  </div>
                  <span className='text-muted-foreground text-sm'>
                    {formatRelativeTime(
                      table.createdAt instanceof Date
                        ? table.createdAt.toISOString()
                        : table.createdAt
                    )}
                  </span>
                  <span className='text-muted-foreground text-sm'>
                    {formatRelativeTime(
                      table.updatedAt instanceof Date
                        ? table.updatedAt.toISOString()
                        : table.updatedAt
                    )}
                  </span>

                  {/* Row actions */}
                  <div className='flex justify-end'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-44'>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(table.id)
                            toast.success('Table ID copied')
                          }}
                        >
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveTable(table)
                            setIsImportDialogOpen(true)
                          }}
                          disabled={userPermissions.canEdit !== true}
                        >
                          Import CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await downloadTableExport(table.id, table.name)
                            } catch (err) {
                              logger.error('Export failed', err)
                              toast.error('Failed to export table')
                            }
                          }}
                        >
                          Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive'
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveTable(table)
                            setIsDeleteDialogOpen(true)
                          }}
                          disabled={userPermissions.canEdit !== true}
                        >
                          Delete table
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Hidden CSV input */}
      <input
        ref={csvInputRef}
        type='file'
        className='hidden'
        onChange={handleCsvChange}
        disabled={uploading}
        accept='.csv,.tsv'
        multiple
      />

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-medium text-foreground'>{activeTable?.name}</span>?{' '}
              <span className='text-destructive'>
                All {activeTable?.rowCount ?? 0} rows will be removed.
              </span>{' '}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setActiveTable(null)}
              disabled={deleteTable.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTable.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteTable.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import CSV dialog */}
      {activeTable && (
        <ImportCsvDialog
          open={isImportDialogOpen}
          onOpenChange={(open) => {
            setIsImportDialogOpen(open)
            if (!open) setActiveTable(null)
          }}
          workspaceId={workspaceId}
          table={activeTable}
        />
      )}
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TablesLoadingSkeleton() {
  return (
    <div className='overflow-hidden rounded-xl border border-border/40'>
      <div className='border-border/40 border-b bg-muted/30 px-4 py-2'>
        <div className='grid grid-cols-[1fr_80px_80px_120px_120px_40px] gap-0'>
          {['Name', 'Cols', 'Rows', 'Created', 'Updated', ''].map((h, i) => (
            <Skeleton key={i} className='h-3 w-12 rounded' />
          ))}
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='border-border/30 border-b px-4 py-3 last:border-0'>
          <div className='grid grid-cols-[1fr_80px_80px_120px_120px_40px] items-center gap-0'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-4 w-4 rounded' />
              <Skeleton className='h-4 w-36 rounded' />
            </div>
            <Skeleton className='h-4 w-8 rounded' />
            <Skeleton className='h-4 w-8 rounded' />
            <Skeleton className='h-4 w-20 rounded' />
            <Skeleton className='h-4 w-20 rounded' />
            <div />
          </div>
        </div>
      ))}
    </div>
  )
}

function TablesEmptyState({
  onCreateTable,
  onImportCsv,
  canEdit,
}: {
  onCreateTable: () => void
  onImportCsv: () => void
  canEdit: boolean
}) {
  return (
    <div className='flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-border border-dashed p-8 text-center'>
      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10'>
        <TableIcon className='h-6 w-6 text-primary' />
      </div>
      <div>
        <h3 className='font-semibold text-foreground'>No tables yet</h3>
        <p className='mt-1 text-muted-foreground text-sm'>
          Create a table to store and manage structured data for your workflows.
        </p>
      </div>
      {canEdit && (
        <div className='flex items-center gap-2'>
          <Button size='sm' onClick={onCreateTable} className='gap-1.5'>
            <Plus className='h-3.5 w-3.5' />
            New table
          </Button>
          <Button size='sm' variant='outline' onClick={onImportCsv} className='gap-1.5'>
            <Upload className='h-3.5 w-3.5' />
            Import CSV
          </Button>
        </div>
      )}
    </div>
  )
}
