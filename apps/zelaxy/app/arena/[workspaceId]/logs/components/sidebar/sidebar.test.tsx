/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BlockContentDisplay } from '@/app/arena/[workspaceId]/logs/components/sidebar/sidebar'

vi.mock('@/components/ui/copy-button', () => ({
  CopyButton: ({ text }: { text: string }) => <button type='button'>Copy {text.length}</button>,
}))

vi.mock('@/app/arena/[workspaceId]/logs/components/sidebar/components/markdown-renderer', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div>{content}</div>,
}))

describe('BlockContentDisplay', () => {
  it('renders the block input JSON when the Parameters tab is selected', () => {
    render(
      <BlockContentDisplay
        systemComment='Block Agent 1 (agent):'
        formatted='{"ok":true}'
        isJson={true}
        blockInput={{ apiKey: 'secret', prompt: 'hello' }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Parameters' }))

    expect(screen.getByText(/"apiKey": "\*\*\*"/)).toBeInTheDocument()
    expect(screen.getByText(/"prompt": "hello"/)).toBeInTheDocument()
  })
})
