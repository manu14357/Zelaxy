// Cross-checks every block's generated docs URL (lib/docs-url.ts's getBlockDocsUrl)
// against the actual files in apps/docs/content/docs/{blocks,tools,triggers}.
// Mirrors lib/docs-url.ts's slug logic - keep the two in sync if either changes.
import fs from 'node:fs'
import path from 'node:path'

const BLOCK_TYPE_TO_DOC_SLUG = { twilio_sms: 'twilio' }
const BLOCKS_WITHOUT_DOCS = new Set(['smtp'])
const DOCS_ROOT = '../docs/content/docs'

function slugFor(type, category) {
  if (BLOCK_TYPE_TO_DOC_SLUG[type]) return BLOCK_TYPE_TO_DOC_SLUG[type]
  return category === 'blocks' ? type : type.replace(/_/g, '-')
}

function docFileExists(category, slug) {
  return fs.existsSync(path.join(DOCS_ROOT, category, `${slug}.mdx`))
}

const blockFiles = fs
  .readdirSync('blocks/blocks')
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .sort()

const entries = []
for (const f of blockFiles) {
  const src = fs.readFileSync(`blocks/blocks/${f}`, 'utf8')
  // `category` only ever appears once as a real (quoted-string) field on the
  // top-level BlockConfig, so anchor on it, then take the nearest preceding
  // `type:` field - the top-level `type` always comes shortly before
  // `category` in these files. Taking the FIRST `type:` in the file is wrong:
  // some blocks (e.g. evaluator.ts, mcp.ts) have an earlier, unrelated nested
  // `type` field (a JSON-schema property, a TS union) before the real one.
  const categoryMatch = src.match(/\n\s*category:\s*'(blocks|tools|triggers)'/)
  if (!categoryMatch) {
    console.warn(`Could not parse category from ${f}, skipping`)
    continue
  }
  const typeMatches = [...src.matchAll(/\n\s*type:\s*'([^']+)'/g)].filter(
    (m) => m.index < categoryMatch.index
  )
  const typeMatch = typeMatches.at(-1)
  if (!typeMatch) {
    console.warn(`Could not parse type from ${f}, skipping`)
    continue
  }
  entries.push({ file: f, type: typeMatch[1], category: categoryMatch[1] })
}

const broken = []
const missing = []
let ok = 0

for (const { file, type, category } of entries) {
  if (BLOCKS_WITHOUT_DOCS.has(type)) continue

  const slug = slugFor(type, category)
  if (docFileExists(category, slug)) {
    ok++
    continue
  }

  // Report whether a doc page exists under a DIFFERENT slug (a fixable mapping
  // bug) vs. no doc page existing at all (a content gap, not a link bug).
  const rawExists = docFileExists(category, type)
  const hyphenExists = docFileExists(category, type.replace(/_/g, '-'))
  if (rawExists || hyphenExists) {
    broken.push({
      file,
      type,
      category,
      computed: slug,
      actual: rawExists ? type : type.replace(/_/g, '-'),
    })
  } else {
    missing.push({ file, type, category, computed: slug })
  }
}

console.log(`Checked ${entries.length} block definitions against ${DOCS_ROOT}`)
console.log(`  OK: ${ok}`)
console.log(
  `  BROKEN (doc page exists under a different slug - fixable in lib/docs-url.ts): ${broken.length}`
)
console.log(
  `  MISSING (no doc page exists under any slug - a content gap, not a link bug): ${missing.length}`
)

if (broken.length > 0) {
  console.log('\nBROKEN LINKS:')
  for (const b of broken) {
    console.log(
      `  [${b.category}] ${b.type} (${b.file}) -> computed "${b.computed}", actual file is "${b.actual}"`
    )
  }
}

if (missing.length > 0) {
  console.log('\nMISSING DOC PAGES:')
  for (const m of missing) {
    console.log(`  [${m.category}] ${m.type} (${m.file})`)
  }
}

if (broken.length > 0) {
  process.exitCode = 1
}
