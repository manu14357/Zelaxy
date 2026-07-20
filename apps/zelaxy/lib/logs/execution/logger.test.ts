import { beforeEach, describe, expect, test } from 'vitest'
import { ExecutionLogger } from '@/lib/logs/execution/logger'

describe('ExecutionLogger', () => {
  let logger: ExecutionLogger

  beforeEach(() => {
    logger = new ExecutionLogger()
  })

  describe('class instantiation', () => {
    test('should create logger instance', () => {
      expect(logger).toBeDefined()
      expect(logger).toBeInstanceOf(ExecutionLogger)
    })
  })

  describe('getTriggerPrefix', () => {
    test('should return correct prefixes for trigger types', () => {
      // Access the private method for testing
      const getTriggerPrefix = (logger as any).getTriggerPrefix.bind(logger)

      expect(getTriggerPrefix('api')).toBe('API')
      expect(getTriggerPrefix('webhook')).toBe('Webhook')
      expect(getTriggerPrefix('schedule')).toBe('Scheduled')
      expect(getTriggerPrefix('manual')).toBe('Manual')
      expect(getTriggerPrefix('chat')).toBe('Chat')
      expect(getTriggerPrefix('unknown' as any)).toBe('Unknown')
    })
  })

  describe('flattenBlockSpans', () => {
    // buildTraceSpans always wraps a run in a single top-level 'workflow' span with one child per
    // executed block — regression for block/success/error counts always reporting "1" (the wrapper
    // array's own length) regardless of how many blocks actually ran.
    const flatten = (spans: any) => (logger as any).flattenBlockSpans(spans)

    test('excludes the workflow wrapper and returns its children as the real block spans', () => {
      const traceSpans = [
        {
          id: 'workflow-execution',
          name: 'Workflow Execution',
          type: 'workflow',
          duration: 100,
          startTime: 't0',
          endTime: 't1',
          status: 'success',
          children: [
            { id: 'b1', name: 'Start', type: 'starter', duration: 1, startTime: 't', endTime: 't' },
            { id: 'b2', name: 'Scrape', type: 'jina', duration: 1, startTime: 't', endTime: 't' },
            {
              id: 'b3',
              name: 'Store',
              type: 'table',
              duration: 1,
              startTime: 't',
              endTime: 't',
              status: 'error',
            },
          ],
        },
      ]

      const flat = flatten(traceSpans)
      expect(flat).toHaveLength(3)
      expect(flat.map((s: any) => s.id)).toEqual(['b1', 'b2', 'b3'])
      expect(flat.filter((s: any) => s.status !== 'error')).toHaveLength(2)
      expect(flat.filter((s: any) => s.status === 'error')).toHaveLength(1)
    })

    test('recurses into nested children (blocks inside a loop/parallel)', () => {
      const traceSpans = [
        {
          id: 'workflow-execution',
          name: 'Workflow Execution',
          type: 'workflow',
          duration: 100,
          startTime: 't0',
          endTime: 't1',
          status: 'success',
          children: [
            {
              id: 'loop1',
              name: 'Loop',
              type: 'loop',
              duration: 10,
              startTime: 't',
              endTime: 't',
              children: [
                {
                  id: 'inner1',
                  name: 'Inner',
                  type: 'function',
                  duration: 1,
                  startTime: 't',
                  endTime: 't',
                },
              ],
            },
          ],
        },
      ]

      const flat = flatten(traceSpans)
      // The loop container itself counts as a span, plus the block(s) inside it.
      expect(flat.map((s: any) => s.id)).toEqual(['loop1', 'inner1'])
    })

    test('handles undefined/empty input without throwing', () => {
      expect(flatten(undefined)).toEqual([])
      expect(flatten([])).toEqual([])
    })
  })
})
