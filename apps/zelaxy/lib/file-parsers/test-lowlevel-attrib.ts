/**
 * Diagnostic: Test low-level WASM API to extract ATTRIB entities directly,
 * bypassing the convert() method that loses them for R13 DWG files.
 *
 * Usage: bunx tsx apps/zelaxy/lib/file-parsers/test-lowlevel-attrib.ts <file.dwg>
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
  throw new Error('Could not find WASM files')
}

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: bunx tsx test-lowlevel-attrib.ts <file.dwg>')
    process.exit(1)
  }

  const { LibreDwg } = await import('@mlightcad/libredwg-web')
  const wasmDir = findWasmDir()
  console.log('WASM dir:', wasmDir)
  const libredwg = await LibreDwg.create(wasmDir)

  const buffer = await readFile(filePath)
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer

  const dwgDataPtr = libredwg.dwg_read_data(arrayBuffer, 0)
  console.log('dwg_read_data result:', dwgDataPtr)

  if (dwgDataPtr == null) {
    console.error('dwg_read_data returned null')
    process.exit(1)
  }

  // Check DWG version
  const version = libredwg.dwg_get_version_type(dwgDataPtr)
  console.log('DWG version:', version)

  // Check codepage
  const codepage = libredwg.dwg_get_codepage(dwgDataPtr)
  console.log('Codepage:', codepage)

  // Try getting ALL entities in model space
  const allModelEntities = libredwg.dwg_getall_entities_in_model_space(dwgDataPtr)
  console.log('\n=== Model space entities (raw pointers) ===')
  console.log('Count:', allModelEntities.length)

  // Check each entity type
  for (const objPtr of allModelEntities) {
    const fixedtype = libredwg.dwg_object_get_fixedtype(objPtr)
    const entity_tio = libredwg.dwg_object_to_entity_tio(objPtr)
    console.log(`  Entity ptr=${objPtr}, fixedtype=${fixedtype}`)

    // If it's ATTRIB (type 2)
    if (fixedtype === 2) {
      console.log('    *** FOUND ATTRIB in model space! ***')
      if (entity_tio) {
        try {
          const textVal = libredwg.dwg_dynapi_entity_value(entity_tio, 'text_value')
          const tagVal = libredwg.dwg_dynapi_entity_value(entity_tio, 'tag')
          console.log('    text_value:', JSON.stringify(textVal))
          console.log('    tag:', JSON.stringify(tagVal))
          if (textVal.bin) {
            const decoder = new TextDecoder('shift_jis')
            console.log('    text (shift_jis):', decoder.decode(textVal.bin))
          }
          if (tagVal.bin) {
            const decoder = new TextDecoder('shift_jis')
            console.log('    tag (shift_jis):', decoder.decode(tagVal.bin))
          }
        } catch (err) {
          console.log('    Error reading ATTRIB fields:', err)
        }
      }
    }

    // If it's INSERT (type 7), try to get attribs
    if (fixedtype === 7) {
      if (entity_tio) {
        try {
          const nameVal = libredwg.dwg_dynapi_entity_value(entity_tio, 'block_header')
          console.log('    INSERT block_header:', JSON.stringify(nameVal))
        } catch {}
      }

      // Try dwg_entity_insert_get_attribs via the object ptr
      try {
        const attribPtrs = libredwg.dwg_entity_insert_get_attribs(objPtr)
        console.log(`    INSERT attribs count: ${attribPtrs.length}`)
        for (const aPtr of attribPtrs) {
          const aType = libredwg.dwg_object_get_fixedtype(aPtr)
          const aTio = libredwg.dwg_object_to_entity_tio(aPtr)
          console.log(`      attrib ptr=${aPtr}, fixedtype=${aType}`)
          if (aTio) {
            try {
              const textVal = libredwg.dwg_dynapi_entity_value(aTio, 'text_value')
              const tagVal = libredwg.dwg_dynapi_entity_value(aTio, 'tag')
              console.log(`      text_value: ${JSON.stringify(textVal)}`)
              console.log(`      tag: ${JSON.stringify(tagVal)}`)
              if (textVal.bin) {
                try {
                  const decoder = new TextDecoder('shift_jis')
                  console.log(`      text (shift_jis): ${decoder.decode(textVal.bin)}`)
                } catch {}
              }
              if (tagVal.bin) {
                try {
                  const decoder = new TextDecoder('shift_jis')
                  console.log(`      tag (shift_jis): ${decoder.decode(tagVal.bin)}`)
                } catch {}
              }
            } catch (err) {
              console.log(`      Error reading attrib fields: ${err}`)
            }
          }
        }
      } catch (err) {
        console.log(`    Error getting insert attribs: ${err}`)
      }
    }
  }

  // Try getting ATTRIB entities directly by type
  console.log('\n=== Direct ATTRIB entity query (DWG_TYPE_ATTRIB = 2) ===')
  try {
    const attribEntities = libredwg.dwg_getall_entity_by_type(dwgDataPtr, 2)
    console.log('ATTRIB entities found:', attribEntities.length)
    for (const entityTio of attribEntities) {
      try {
        const textVal = libredwg.dwg_dynapi_entity_value(entityTio, 'text_value')
        const tagVal = libredwg.dwg_dynapi_entity_value(entityTio, 'tag')
        console.log(`  ATTRIB tag=${JSON.stringify(tagVal)} text=${JSON.stringify(textVal)}`)
        if (textVal.bin) {
          try {
            const decoder = new TextDecoder('shift_jis')
            console.log(`    text (shift_jis): ${decoder.decode(textVal.bin)}`)
          } catch {}
        }
        if (tagVal.bin) {
          try {
            const decoder = new TextDecoder('shift_jis')
            console.log(`    tag (shift_jis): ${decoder.decode(tagVal.bin)}`)
          } catch {}
        }
      } catch (err) {
        console.log(`  Error: ${err}`)
      }
    }
  } catch (err) {
    console.log('Error getting ATTRIB by type:', err)
  }

  // Try getting ATTDEF entities directly
  console.log('\n=== Direct ATTDEF entity query (DWG_TYPE_ATTDEF = 3) ===')
  try {
    const attdefEntities = libredwg.dwg_getall_entity_by_type(dwgDataPtr, 3)
    console.log('ATTDEF entities found:', attdefEntities.length)
    for (const entityTio of attdefEntities) {
      try {
        const defVal = libredwg.dwg_dynapi_entity_value(entityTio, 'default_value')
        const tagVal = libredwg.dwg_dynapi_entity_value(entityTio, 'tag')
        const promptVal = libredwg.dwg_dynapi_entity_value(entityTio, 'prompt')
        console.log(
          `  ATTDEF tag=${JSON.stringify(tagVal)} default=${JSON.stringify(defVal)} prompt=${JSON.stringify(promptVal)}`
        )
        if (defVal.bin) {
          try {
            const decoder = new TextDecoder('shift_jis')
            console.log(`    default (shift_jis): ${decoder.decode(defVal.bin)}`)
          } catch {}
        }
        if (tagVal.bin) {
          try {
            const decoder = new TextDecoder('shift_jis')
            console.log(`    tag (shift_jis): ${decoder.decode(tagVal.bin)}`)
          } catch {}
        }
      } catch (err) {
        console.log(`  Error: ${err}`)
      }
    }
  } catch (err) {
    console.log('Error getting ATTDEF by type:', err)
  }

  // Free the DWG data
  try {
    libredwg.dwg_free(dwgDataPtr)
  } catch {}

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
