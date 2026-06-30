import fs from 'node:fs'

const N = Number(process.argv[2] || 50)
const offset = Number(process.argv[3] || 0)
const files = fs
  .readdirSync('blocks/blocks')
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .sort()
  .slice(offset, offset + N)

const findings = []
for (const f of files) {
  const src = fs.readFileSync(`blocks/blocks/${f}`, 'utf8')

  // Collect subBlock ids: lines like "id: 'foo'," inside the subBlocks array.
  // Heuristic: ids declared with single/double quotes.
  const idMatches = [...src.matchAll(/\bid:\s*['"]([a-zA-Z0-9_]+)['"]/g)].map((m) => m[1])
  const idCounts = {}
  for (const id of idMatches) idCounts[id] = (idCounts[id] || 0) + 1

  // Condition field references: condition: { field: 'x' ... }
  const condFields = [
    ...src.matchAll(/condition:\s*\{[\s\S]*?field:\s*['"]([a-zA-Z0-9_]+)['"]/g),
  ].map((m) => m[1])
  // Also 'and: { field: ... }' nested
  const andFields = [...src.matchAll(/and:\s*\{[\s\S]*?field:\s*['"]([a-zA-Z0-9_]+)['"]/g)].map(
    (m) => m[1]
  )

  const idSet = new Set(idMatches)
  const orphanFields = [...new Set([...condFields, ...andFields])].filter((cf) => !idSet.has(cf))

  // empty outputs: outputs: {}
  const emptyOutputs = /outputs:\s*\{\s*\}/.test(src)

  if (orphanFields.length || emptyOutputs) {
    findings.push({ f, orphanFields, emptyOutputs })
  }
}

console.log(`Checked ${files.length} blocks (offset ${offset}).`)
if (findings.length === 0) {
  console.log('No structural anomalies (orphan condition fields / empty outputs). OK')
} else {
  for (const fd of findings) {
    console.log(`\n- ${fd.f}`)
    if (fd.orphanFields.length)
      console.log(
        `    condition.field referencing unknown subBlock id: ${fd.orphanFields.join(', ')}`
      )
    if (fd.emptyOutputs) console.log('    empty outputs: {}')
  }
}
