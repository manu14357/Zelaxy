import fs from 'node:fs'

// 1) Extract registered tool ids from tools/registry.ts (the `tools` object keys)
const reg = fs.readFileSync('tools/registry.ts', 'utf8').split(/\r?\n/)
const start = reg.findIndex((l) => l.includes('export const tools: Record<string, ToolConfig> = {'))
const ids = new Set()
for (let i = start + 1; i < reg.length; i++) {
  const l = reg[i]
  if (/^\}/.test(l)) break
  const m = l.match(/^\s{2}([a-zA-Z0-9_]+):/)
  if (m) ids.add(m[1])
}
console.log('registered tool ids:', ids.size)

const N = Number(process.argv[2] || 50)
const offset = Number(process.argv[3] || 0)
const files = fs
  .readdirSync('blocks/blocks')
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .sort()
  .slice(offset, offset + N)

const problems = []
const noTools = []
for (const f of files) {
  const src = fs.readFileSync(`blocks/blocks/${f}`, 'utf8')
  const m = src.match(/access:\s*\[([\s\S]*?)\]/)
  if (!m) {
    noTools.push(f)
    continue
  }
  const toolIds = [...m[1].matchAll(/['"`]([a-zA-Z0-9_]+)['"`]/g)].map((x) => x[1])
  const missing = toolIds.filter((t) => !ids.has(t))

  // Also check LITERAL tool ids returned by config.tool(...) — e.g. `=> params.op || 'some_tool'`
  // or `=> 'some_tool'`. A literal that isn't registered fails at runtime even though tools.access
  // looks fine (the enrich bug class). Dynamic returns like `params.operation` aren't literals, so
  // they're skipped here; verify-blocks-structure / the runtime registry covers those.
  const toolFn = src.match(/tool:\s*\([^)]*\)\s*=>\s*([^\n]+)/)
  if (toolFn) {
    // Strip comparison operands (e.g. `params.operation === 'write'`) so only RETURNED tool-id
    // literals remain — comparison values aren't tool ids and would be false positives.
    const body = toolFn[1].replace(/[=!]==?\s*['"`][^'"`]*['"`]/g, '')
    const cfgLiterals = [...body.matchAll(/['"`]([a-zA-Z0-9_]+)['"`]/g)].map((x) => x[1])
    for (const t of cfgLiterals) {
      if (!ids.has(t) && !missing.includes(t)) missing.push(t)
    }
  }

  if (missing.length) problems.push({ f, missing })
}

console.log(`\nChecked ${files.length} blocks (offset ${offset}).`)
console.log('Blocks with no tools.access (triggers/special):', noTools.length)
if (problems.length === 0) {
  console.log('All tools.access ids resolve to a registered tool. OK')
} else {
  console.log('\nBLOCKS WITH UNRESOLVED TOOL IDS:')
  for (const p of problems) console.log(' -', p.f, '->', p.missing.join(', '))
}
