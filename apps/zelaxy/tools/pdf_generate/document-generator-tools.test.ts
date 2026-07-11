/**
 * Direct-execution tests for the Document Generator tools (pdf/docx/pptx).
 * These run server-side via directExecution (no HTTP), so we assert that contract.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { docxGenerateTool } from '@/tools/docx_generate'
import { pdfGenerateTool } from '@/tools/pdf_generate'
import { pptxGenerateTool } from '@/tools/pptx_generate'

describe('Document Generator tools', () => {
  const tools: Array<[string, any]> = [
    ['pdf_generate', pdfGenerateTool],
    ['docx_generate', docxGenerateTool],
    ['pptx_generate', pptxGenerateTool],
  ]
  for (const [id, tool] of tools) {
    it(`${id}: is a direct-execution tool with the right contract`, () => {
      expect(tool.id).toBe(id)
      expect(typeof tool.directExecution).toBe('function')
      expect(Object.keys(tool.params ?? {}).length).toBeGreaterThan(0)
      expect(tool.outputs).toBeDefined()
    })
  }
})
