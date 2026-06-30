import fs from 'node:fs'

// Detect block UI problems that make properties not render on the canvas:
//  (A) sub-block `type` not handled by the sub-block renderer -> "Unknown input type"
//  (B) block has zero sub-blocks (excluding legitimate trigger/note blocks)
//  (C) block has sub-blocks but NONE is unconditionally visible in default (basic) mode
//      i.e. every sub-block is hidden / mode:'advanced' / has a condition -> empty panel

// 1) Handled sub-block types = the `case '...':` labels in the renderer switch.
const renderer = fs.readFileSync(
  'app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/sub-block.tsx',
  'utf8'
)
const handled = new Set([...renderer.matchAll(/case\s*'([a-z0-9-]+)':/g)].map((m) => m[1]))

const files = fs
  .readdirSync('blocks/blocks')
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .sort()

const unknownType = []
const emptyBlocks = []
const allHidden = []

for (const f of files) {
  const src = fs.readFileSync(`blocks/blocks/${f}`, 'utf8')

  // Block-level category + type
  const category = (src.match(/\bcategory:\s*'([a-z]+)'/) || [])[1] || ''
  const blockType = (src.match(/^\s{2}type:\s*'([^']+)'/m) || [])[1] || ''

  // Isolate the subBlocks: [ ... ] region (between "subBlocks:" and the next top-level "tools:" or "inputs:")
  const sbStart = src.indexOf('subBlocks:')
  if (sbStart === -1) {
    emptyBlocks.push({ f, category, reason: 'no subBlocks field' })
    continue
  }
  const after = src.slice(sbStart)
  const endIdx = (() => {
    const t = after.search(/\n\s{2}tools:/)
    const i = after.search(/\n\s{2}inputs:/)
    const cands = [t, i].filter((x) => x !== -1)
    return cands.length ? Math.min(...cands) : after.length
  })()
  const region = after.slice(0, endIdx)

  // Each sub-block object: capture its type + whether it has hidden:true / mode:'advanced' / condition
  // Split region into top-level objects is hard; instead count `type:` occurrences as sub-blocks.
  const typeMatches = [...region.matchAll(/\btype:\s*'([a-z0-9-]+)'/g)].map((m) => m[1])

  if (typeMatches.length === 0) {
    if (category !== 'triggers' && blockType !== 'note')
      emptyBlocks.push({ f, category, reason: 'subBlocks empty' })
    continue
  }

  // (A) unknown types
  for (const t of typeMatches) {
    if (!handled.has(t)) unknownType.push({ f, type: t })
  }

  // (C) Accurate per-sub-block parse: split the region into top-level `{ ... }` objects
  // via brace-depth tracking, then check each for visibility gating.
  const objects = []
  {
    const bracketStart = region.indexOf('[')
    let depth = 0
    let cur = ''
    let capturing = false
    for (let i = bracketStart + 1; i < region.length; i++) {
      const ch = region[i]
      if (ch === '{') {
        if (depth === 0) {
          capturing = true
          cur = ''
        }
        depth++
      }
      if (capturing) cur += ch
      if (ch === '}') {
        depth--
        if (depth === 0 && capturing) {
          objects.push(cur)
          capturing = false
        }
      }
      if (ch === ']' && depth === 0) break
    }
  }

  // A sub-block is visible at default (basic mode, empty state) if it is not hidden,
  // not mode:'advanced', and has no condition (conditions depend on other field values
  // which are empty at default, so conditional fields are NOT shown initially).
  const visibleAtDefault = objects.filter((o) => {
    if (/\bhidden:\s*true/.test(o)) return false
    if (/\bmode:\s*'advanced'/.test(o)) return false
    if (/\bcondition:/.test(o)) return false
    return /\bid:/.test(o) && /\btype:/.test(o)
  })

  if (objects.length > 0 && visibleAtDefault.length === 0) {
    allHidden.push({ f, category, sbCount: objects.length })
  }
}

console.log('Handled sub-block types:', handled.size)
console.log(`\n(A) Sub-block types NOT handled by renderer (-> "Unknown input type"):`)
if (unknownType.length === 0) console.log('  none')
else for (const u of unknownType) console.log(`  ${u.f}: '${u.type}'`)

console.log(`\n(B) Blocks with zero sub-blocks (excluding triggers/note):`)
if (emptyBlocks.length === 0) console.log('  none')
else for (const e of emptyBlocks) console.log(`  ${e.f} [${e.category}] - ${e.reason}`)

console.log(
  `\n(C) Blocks with NO unconditionally-visible sub-block at default (empty panel on drop):`
)
if (allHidden.length === 0) console.log('  none')
else for (const a of allHidden) console.log(`  ${a.f} [${a.category}] subBlocks=${a.sbCount}`)
