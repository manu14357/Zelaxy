/** Tailwind class applied to selected rows / columns / cells. */
export const SELECTION_TINT_BG = 'bg-[rgba(37,99,235,0.06)]'

/** Default column width in pixels. */
export const COL_WIDTH = 160

/** Width of the "add column" placeholder column in pixels. */
export const ADD_COL_WIDTH = 120

/** Column config sidebar width in pixels. */
export const COLUMN_SIDEBAR_WIDTH = 400

/** Number of skeleton rows shown while the table body is loading. */
export const SKELETON_ROW_COUNT = 10

export const CELL =
  'border-border border-r border-b px-2 py-[7px] align-middle select-none'
export const CELL_CHECKBOX =
  'sticky left-0 z-[6] border-border border-r border-b bg-background px-1 py-[7px] align-middle select-none'
export const CELL_HEADER_CHECKBOX =
  'sticky left-0 z-[12] border-border border-r border-b bg-background px-1 py-[7px] text-center align-middle'
export const CELL_CONTENT =
  'relative flex h-[22px] min-w-0 items-center overflow-clip text-ellipsis whitespace-nowrap text-sm'
export const SELECTION_OVERLAY =
  'pointer-events-none absolute -top-px -right-px -bottom-px z-[5] border-2 border-primary'
