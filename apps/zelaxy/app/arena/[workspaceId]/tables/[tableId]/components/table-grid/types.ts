import type { ColumnDefinition } from '@/lib/table'

/**
 * One visual column in the rendered grid — one-to-one with ColumnDefinition.
 */
export interface DisplayColumn extends ColumnDefinition {
  /** Stable per-visual-column identifier (= column.name). */
  key: string
}
