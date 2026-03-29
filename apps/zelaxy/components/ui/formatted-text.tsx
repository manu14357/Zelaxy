'use client'

import type { ReactNode } from 'react'
import { VariableManager } from '@/lib/variables/variable-manager'

/**
 * Formats text by highlighting block references and environment variables ({{...}})
 * Used in code editor, long inputs, and short inputs for consistent syntax highlighting
 *
 * @param text The text to format
 * @param stripQuotes Whether to strip unnecessary quotes from the text (for plain text variables)
 */
export function formatDisplayText(text: string, stripQuotes = false): ReactNode[] {
  if (!text) return []

  // If stripQuotes is true, remove surrounding quotes that might have been added
  // This is needed when displaying plain type variables in inputs
  let processedText = text
  if (stripQuotes && typeof text === 'string') {
    // Use VariableManager to determine if quotes should be stripped
    if (VariableManager.shouldStripQuotesForDisplay(text)) {
      processedText = text.slice(1, -1)
    }
  }

  // Split the text only by the {{...}} pattern for variables and block references
  const parts = processedText.split(/(\{\{[^}]+\}\})/g)

  return parts.map((part, index) => {
    // Handle both environment variables and block references using {{...}} syntax
    if (part.match(/^\{\{[^}]+\}\}$/)) {
      return (
        <span key={index} className='text-primary'>
          {part}
        </span>
      )
    }

    return <span key={index}>{part}</span>
  })
}
