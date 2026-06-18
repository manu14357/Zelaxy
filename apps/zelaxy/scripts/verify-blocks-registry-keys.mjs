import fs from 'node:fs'

// getBlock(type) === registry[type], and the toolbar drags using block.type.
// So every registry KEY must equal the block's `type` field, or the block
// cannot be dropped onto the canvas. This script flags any mismatch.

const reg = fs.readFileSync('blocks/registry.ts', 'utf8')

// Map import identifier -> source file, e.g. "ZelaxyArenaBlock" -> "zelaxy_arena"
const importRe = /import\s*\{?\s*([A-Za-z0-9_]+)\s*\}?\s*from\s*'@\/blocks\/blocks\/([a-z0-9_]+)'/g
const identToFile = {}
for (const m of reg.matchAll(importRe)) identToFile[m[1]] = m[2]

// Map registry key -> import identifier inside the `registry` object.
// Keys may be quoted (e.g. 'zelaxy-arena') or bare (e.g. google_calendar).
const entryRe = /^\s{2}(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_]+))\s*:\s*([A-Za-z0-9_]+)\s*,/gm
const entries = []
for (const m of reg.matchAll(entryRe)) {
  const key = m[1] ?? m[2] ?? m[3]
  const ident = m[4]
  if (identToFile[ident]) entries.push({ key, ident, file: identToFile[ident] })
}

const mismatches = []
for (const e of entries) {
  const src = fs.readFileSync('blocks/blocks/' + e.file + '.ts', 'utf8')
  // Extract the BLOCK-LEVEL type: the first `type:` AFTER the `export const <Ident>` declaration,
  // not an earlier `type:` inside an interface or a sub-block schema value above it.
  const declIdx = src.indexOf('export const ' + e.ident)
  const scope = declIdx === -1 ? src : src.slice(declIdx)
  const tm = scope.match(/\btype:\s*['"]([^'"]+)['"]/)
  if (!tm) {
    mismatches.push({ ...e, type: '(no type field found)' })
    continue
  }
  const type = tm[1]
  if (type !== e.key) mismatches.push({ ...e, type })
}

console.log(`Checked ${entries.length} registry entries.`)
if (mismatches.length === 0) {
  console.log('All registry keys equal their block.type. OK')
} else {
  console.log('\nREGISTRY KEY != block.type (block cannot be dropped on canvas):')
  for (const m of mismatches) {
    console.log(`  key '${m.key}'  ->  ${m.file}.ts has type '${m.type}'  (${m.ident})`)
  }
}
