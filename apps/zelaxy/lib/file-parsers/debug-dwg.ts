/**
 * Debug script to inspect DWG WASM output structure.
 * Run: npx tsx apps/zelaxy/lib/file-parsers/debug-dwg.ts <path-to-dwg-file>
 */

import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'

function findWasmDir(): string {
  const wasmSubpath = path.join('node_modules', '@mlightcad', 'libredwg-web', 'wasm')
  let dir = process.cwd()
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, wasmSubpath)
    if (existsSync(path.join(candidate, 'libredwg-web.wasm'))) return `${candidate}/`
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error('WASM files not found')
}

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx tsx apps/zelaxy/lib/file-parsers/debug-dwg.ts <dwg-file>')
    process.exit(1)
  }

  const buffer = await readFile(filePath)
  console.log(`File: ${filePath} (${buffer.length} bytes)\n`)

  const { LibreDwg } = await import('@mlightcad/libredwg-web')
  const wasmDir = findWasmDir()
  const libredwg = await LibreDwg.create(wasmDir)

  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer
  const dwgDataPtr = libredwg.dwg_read_data(arrayBuffer, 0)
  if (!dwgDataPtr) {
    console.error('dwg_read_data returned null')
    process.exit(1)
  }

  const db = libredwg.convert(dwgDataPtr)
  libredwg.dwg_free(dwgDataPtr)

  // 1. Model space entities
  const entities = db.entities ?? []
  console.log(`=== MODEL SPACE ENTITIES: ${entities.length} ===`)

  const typeCounts: Record<string, number> = {}
  for (const e of entities) {
    const t = e?.type ?? 'UNKNOWN'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }
  console.log('Type counts:', JSON.stringify(typeCounts, null, 2))

  // 2. Inspect INSERT entities in detail
  console.log('\n=== INSERT ENTITIES (detailed) ===')
  for (const e of entities) {
    if (e?.type === 'INSERT') {
      console.log(`\nINSERT block: "${(e as any).name}" [layer: ${e.layer}]`)
      console.log('  Property keys:', Object.keys(e).join(', '))

      const attribs = (e as any).attribs
      console.log(
        `  attribs type: ${typeof attribs}, isArray: ${Array.isArray(attribs)}, length: ${attribs?.length ?? 'N/A'}`
      )

      if (Array.isArray(attribs) && attribs.length > 0) {
        for (const a of attribs) {
          console.log(`  ATTRIB:`)
          console.log(`    type: ${a?.type}`)
          console.log(`    tag: ${a?.tag}`)
          console.log(`    attrTag: ${a?.attrTag}`)
          console.log(`    text type: ${typeof a?.text}`)
          if (typeof a?.text === 'object' && a?.text) {
            console.log(`    text.text: "${a.text.text}"`)
            console.log(`    text keys: ${Object.keys(a.text).join(', ')}`)
          } else {
            console.log(`    text value: "${a?.text}"`)
          }
          console.log(`    All keys: ${Object.keys(a ?? {}).join(', ')}`)
        }
      }

      // Check other possible attrib-related properties
      for (const key of Object.keys(e)) {
        if (
          key.toLowerCase().includes('attrib') ||
          key.toLowerCase().includes('attr') ||
          key.toLowerCase().includes('owned')
        ) {
          console.log(`  ${key}: ${JSON.stringify((e as any)[key]).substring(0, 200)}`)
        }
      }
    }
  }

  // 3. Look for ATTRIB entities in model space
  console.log('\n=== ATTRIB/ATTDEF ENTITIES IN MODEL SPACE ===')
  for (const e of entities) {
    const t = (e?.type ?? '').toUpperCase()
    if (t === 'ATTRIB' || t === 'ATTDEF') {
      console.log(
        `  ${e.type}: tag="${(e as any).tag}", attrTag="${(e as any).attrTag}", text=${JSON.stringify((e as any).text).substring(0, 200)}`
      )
    }
  }

  // 4. Block record entities
  console.log('\n=== BLOCK RECORDS ===')
  const blockEntries = db.tables?.BLOCK_RECORD?.entries ?? []
  for (const b of blockEntries) {
    if (b.name && !b.name.startsWith('*')) {
      const ents = b.entities ?? []
      const bTypeCounts: Record<string, number> = {}
      for (const e of ents) {
        if (e?.type) bTypeCounts[e.type] = (bTypeCounts[e.type] || 0) + 1
      }
      console.log(`\nBlock "${b.name}": ${ents.length} entities`)
      if (Object.keys(bTypeCounts).length > 0) {
        console.log('  Types:', JSON.stringify(bTypeCounts))
      }

      // Show ATTDEF entities in blocks
      for (const e of ents) {
        if (e?.type === 'ATTDEF') {
          const a = e as any
          const textVal = typeof a.text === 'string' ? a.text : a.text?.text
          console.log(
            `  ATTDEF: tag="${a.tag}", attrTag="${a.attrTag}", prompt="${a.prompt}", text="${textVal}"`
          )
        }
      }
    }
  }

  // 5. Check db.objects
  console.log('\n=== DB OBJECTS ===')
  console.log('Object keys:', Object.keys(db.objects ?? {}).join(', '))

  // 6. Scan ALL entities for any text-bearing properties we might be missing
  console.log('\n=== ENTITIES WITH UNEXTRACTED TEXT ===')
  for (const e of entities) {
    if (!e || ['TEXT', 'MTEXT', 'DIMENSION'].includes(e.type)) continue
    for (const [key, val] of Object.entries(e as any)) {
      if (
        typeof val === 'string' &&
        val.length > 2 &&
        !['handle', 'layer', 'type', 'ownerBlockRecordSoftId', 'lineType'].includes(key)
      ) {
        console.log(`  ${e.type}[${e.layer}].${key} = "${val.substring(0, 100)}"`)
      }
    }
  }
}

main().catch(console.error)
