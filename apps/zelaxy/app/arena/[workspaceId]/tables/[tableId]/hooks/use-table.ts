'use client'

import { useCallback, useMemo } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDefinition, TableDefinition, TableRow } from '@/lib/table/constants'
import { TABLE_LIMITS } from '@/lib/table/constants'
import { tableKeys, useInfiniteTableRows, useTable as useTableQuery } from '@/hooks/queries/tables'
import type { QueryOptions } from '../types'

const EMPTY_COLUMNS: ColumnDefinition[] = []

interface UseTableParams {
  tableId: string
  queryOptions: QueryOptions
}

interface RowsPage {
  rows: TableRow[]
  nextOffset: number | null
}

interface FetchNextPageResult {
  hasNextPage: boolean
}

export interface UseTableReturn {
  tableData: TableDefinition | undefined
  isLoadingTable: boolean
  rows: TableRow[]
  isLoadingRows: boolean
  refetchRows: () => void
  fetchNextPage: () => Promise<FetchNextPageResult>
  hasNextPage: boolean
  isFetchingNextPage: boolean
  columns: ColumnDefinition[]
  ensureAllRowsLoaded: () => Promise<TableRow[]>
  ensureRowsLoadedUpTo: (maxRows: number) => Promise<{ rows: TableRow[]; hasMore: boolean }>
}

export function useTable({ tableId, queryOptions }: UseTableParams): UseTableReturn {
  const queryClient = useQueryClient()
  const { data: tableData, isLoading: isLoadingTable } = useTableQuery(tableId)

  const {
    data: rowsData,
    isLoading: isLoadingRows,
    refetch,
    fetchNextPage: rawFetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTableRows(tableId, {
    filter: queryOptions.filter ?? undefined,
    sort: queryOptions.sort ?? undefined,
    pageSize: TABLE_LIMITS.MAX_QUERY_LIMIT,
  })

  const rows = useMemo<TableRow[]>(
    () => rowsData?.pages.flatMap((p) => p.rows) ?? [],
    [rowsData?.pages]
  )

  const refetchRows = useCallback(() => {
    void refetch()
  }, [refetch])

  const columns = useMemo(
    () => tableData?.schema?.columns ?? EMPTY_COLUMNS,
    [tableData?.schema?.columns]
  )

  const getRowsQueryKey = useCallback(() => {
    const paramsKey = JSON.stringify({
      filter: queryOptions.filter ?? undefined,
      sort: queryOptions.sort ?? undefined,
      pageSize: TABLE_LIMITS.MAX_QUERY_LIMIT,
    })
    return tableKeys.infiniteRows(tableId, paramsKey)
  }, [tableId, queryOptions.filter, queryOptions.sort])

  const ensureAllRowsLoaded = useCallback(async (): Promise<TableRow[]> => {
    const queryKey = getRowsQueryKey()
    while (true) {
      const data = queryClient.getQueryData<InfiniteData<RowsPage>>(queryKey)
      const lastPage = data?.pages[data.pages.length - 1]
      if (!lastPage || lastPage.rows.length < TABLE_LIMITS.MAX_QUERY_LIMIT) break
      await rawFetchNextPage()
    }
    return (
      queryClient.getQueryData<InfiniteData<RowsPage>>(queryKey)?.pages.flatMap((p) => p.rows) ?? []
    )
  }, [getRowsQueryKey, queryClient, rawFetchNextPage])

  const ensureRowsLoadedUpTo = useCallback(
    async (maxRows: number): Promise<{ rows: TableRow[]; hasMore: boolean }> => {
      const queryKey = getRowsQueryKey()
      while (true) {
        const data = queryClient.getQueryData<InfiniteData<RowsPage>>(queryKey)
        const loaded = data?.pages.reduce((s, p) => s + p.rows.length, 0) ?? 0
        if (loaded > maxRows) break
        const lastPage = data?.pages[data.pages.length - 1]
        if (!lastPage || lastPage.rows.length < TABLE_LIMITS.MAX_QUERY_LIMIT) break
        await rawFetchNextPage()
      }
      const all =
        queryClient.getQueryData<InfiniteData<RowsPage>>(queryKey)?.pages.flatMap((p) => p.rows) ??
        []
      return {
        rows: all.length > maxRows ? all.slice(0, maxRows) : all,
        hasMore: all.length > maxRows,
      }
    },
    [getRowsQueryKey, queryClient, rawFetchNextPage]
  )

  const fetchNextPage = useCallback(async (): Promise<FetchNextPageResult> => {
    const result = await rawFetchNextPage()
    return {
      hasNextPage: Boolean(result.data?.pages[result.data.pages.length - 1]?.nextOffset !== null),
    }
  }, [rawFetchNextPage])

  return {
    tableData,
    isLoadingTable,
    rows,
    isLoadingRows,
    refetchRows,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    columns,
    ensureAllRowsLoaded,
    ensureRowsLoadedUpTo,
  }
}
