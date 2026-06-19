import { describe, expect, it } from 'vitest'
import { chunkText, createChunker, estimateTokens } from './chunkers'

describe('estimateTokens', () => {
  it('returns 0 for empty/whitespace', () => {
    expect(estimateTokens('')).toBe(0)
    expect(estimateTokens('   \n  ')).toBe(0)
  })
  it('counts short words as ~1 token each', () => {
    expect(estimateTokens('the cat sat')).toBe(3)
  })
})

describe('sentence strategy', () => {
  it('packs whole sentences and never splits mid-sentence', async () => {
    const text = 'First sentence here. Second sentence follows. Third one ends it.'
    const chunks = await chunkText(text, { strategy: 'sentence', chunkSize: 10000 })
    // Small text under the size → one chunk containing all sentences intact.
    expect(chunks.length).toBe(1)
    expect(chunks[0].text).toContain('First sentence here.')
    expect(chunks[0].text).toContain('Third one ends it.')
  })

  it('does not break on common abbreviations', async () => {
    const text = 'Dr. Smith arrived. He was late.'
    const chunks = await chunkText(text, { strategy: 'sentence', chunkSize: 3 })
    // "Dr." should not be treated as a sentence boundary.
    const first = chunks[0].text
    expect(first.startsWith('Dr. Smith')).toBe(true)
  })

  it('splits into multiple chunks when over the size budget', async () => {
    const sentences = Array.from({ length: 20 }, (_, i) => `This is sentence number ${i}.`).join(
      ' '
    )
    const chunks = await chunkText(sentences, { strategy: 'sentence', chunkSize: 20 })
    expect(chunks.length).toBeGreaterThan(1)
  })
})

describe('token strategy', () => {
  it('produces overlapping windows over words', async () => {
    const words = Array.from({ length: 100 }, (_, i) => `w${i}`).join(' ')
    const chunks = await chunkText(words, { strategy: 'token', chunkSize: 20, overlap: 5 })
    expect(chunks.length).toBeGreaterThan(1)
    // Reassembled content covers all words.
    expect(chunks.map((c) => c.text).join(' ')).toContain('w0')
    expect(chunks.map((c) => c.text).join(' ')).toContain('w99')
  })
})

describe('regex strategy', () => {
  it('strict boundaries makes each match its own chunk', async () => {
    const text = 'alpha|beta|gamma|delta'
    const chunks = await chunkText(text, {
      strategy: 'regex',
      pattern: '\\|',
      strictBoundaries: true,
      chunkSize: 10000,
    })
    expect(chunks.map((c) => c.text)).toEqual(['alpha', 'beta', 'gamma', 'delta'])
  })

  it('without strict boundaries, small splits pack together', async () => {
    const text = 'a|b|c|d'
    const chunks = await chunkText(text, {
      strategy: 'regex',
      pattern: '\\|',
      chunkSize: 10000,
    })
    expect(chunks.length).toBe(1)
  })

  it('invalid regex falls back to paragraph splitting (does not throw)', async () => {
    const text = 'para one\n\npara two'
    const chunks = await chunkText(text, { strategy: 'regex', pattern: '(' })
    expect(chunks.length).toBeGreaterThanOrEqual(1)
  })
})

describe('auto routing', () => {
  it('routes JSON arrays to one-record-per-chunk (when small max size)', async () => {
    const json = JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }])
    const chunks = await chunkText(
      json,
      { strategy: 'auto', chunkSize: 2 },
      { filename: 'data.json' }
    )
    expect(chunks.length).toBe(3)
    expect(chunks[0].text).toContain('"id":1')
  })

  it('routes CSV to row-grouped chunks with header preserved', async () => {
    const csv = 'name,age\nAlice,30\nBob,25'
    const chunks = await chunkText(
      csv,
      { strategy: 'auto', chunkSize: 5 },
      { filename: 'people.csv' }
    )
    // Each chunk should carry the header line.
    expect(chunks.every((c) => c.text.includes('name,age'))).toBe(true)
  })

  it('routes prose to the text strategy', async () => {
    const prose = 'Hello world. This is a plain text document about cats and dogs.'
    const chunks = await chunkText(prose, { strategy: 'auto' }, { filename: 'notes.txt' })
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    expect(chunks[0].text).toContain('Hello world')
  })
})

describe('recursive recipe', () => {
  it('accepts a built-in recipe without error', async () => {
    const md = '# Title\n\nSome intro.\n\n## Section\n\nBody text here.'
    const chunks = await chunkText(md, {
      strategy: 'recursive',
      recipe: 'markdown',
      chunkSize: 1000,
    })
    expect(chunks.length).toBeGreaterThanOrEqual(1)
  })
})

describe('createChunker factory', () => {
  it('defaults to auto when no strategy given', () => {
    const chunker = createChunker({}, { filename: 'x.txt' })
    expect(typeof chunker.chunk).toBe('function')
  })
})
