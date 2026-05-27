'use client'

import type { SaveReason } from '../../../types'
import type { DisplayColumn } from '../types'
import { CellRender, resolveCellRender } from './cell-render'
import { InlineEditor } from './inline-editors'

interface CellContentProps {
  value: unknown
  column: DisplayColumn
  isEditing: boolean
  initialCharacter?: string | null
  onSave: (value: unknown, reason: SaveReason) => void
  onCancel: () => void
}

export function CellContent({
  value,
  column,
  isEditing,
  initialCharacter,
  onSave,
  onCancel,
}: CellContentProps) {
  const kind = resolveCellRender({ value, column })

  return (
    <>
      {isEditing && (
        <div className='absolute inset-0 z-10 flex items-center px-0'>
          <InlineEditor
            value={value}
            column={column}
            initialCharacter={initialCharacter ?? undefined}
            onSave={onSave}
            onCancel={onCancel}
          />
        </div>
      )}
      <CellRender kind={kind} isEditing={isEditing} />
    </>
  )
}
