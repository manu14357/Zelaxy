/**
 * Request-builder tests for the Amazon Textract tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { analyzeDocumentTool } from '@/tools/textract/analyze_document'
import { detectDocumentTextTool } from '@/tools/textract/detect_document_text'

const P: any = {
  accessToken: 't',
  apiKey: 'k',
  secretKey: 's',
  baseId: 'b',
  tableId: 'tb',
  recordId: 'r',
  collectionId: 'c',
  applicationId: 'app',
  indexName: 'idx',
  objectID: 'o',
  datasetId: 'd',
  actorId: 'a',
  runId: 'run',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  queueUrl: 'https://q',
  tableName: 'T',
  userId: 'u',
  email: 'e@x.com',
  domain: 'x.com',
  query: 'q',
}

describe('Amazon Textract tools', () => {
  it('textract_analyze_document: builds its request', () => {
    expect(analyzeDocumentTool.id).toBe('textract_analyze_document')
    expect(analyzeDocumentTool.request.method).toBe('POST')
    const u =
      typeof analyzeDocumentTool.request.url === 'function'
        ? (analyzeDocumentTool.request.url as any)(P)
        : analyzeDocumentTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(analyzeDocumentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(analyzeDocumentTool.outputs).toBeDefined()
    expect(typeof analyzeDocumentTool.transformResponse).toBe('function')
  })

  it('textract_detect_document_text: builds its request', () => {
    expect(detectDocumentTextTool.id).toBe('textract_detect_document_text')
    expect(detectDocumentTextTool.request.method).toBe('POST')
    const u =
      typeof detectDocumentTextTool.request.url === 'function'
        ? (detectDocumentTextTool.request.url as any)(P)
        : detectDocumentTextTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(detectDocumentTextTool.params ?? {}).length).toBeGreaterThan(0)
    expect(detectDocumentTextTool.outputs).toBeDefined()
    expect(typeof detectDocumentTextTool.transformResponse).toBe('function')
  })
})
