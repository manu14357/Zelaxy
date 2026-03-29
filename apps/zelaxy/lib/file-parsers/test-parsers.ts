/**
 * Quick integration test for the enhanced DWG/DXF parsers.
 * Usage: bunx tsx apps/zelaxy/lib/file-parsers/test-parsers.ts <file.dwg|file.dxf>
 */
import { DwgParser } from './dwg-parser'
import { DxfNativeParser } from './dxf-native-parser'

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: bunx tsx test-parsers.ts <file.dwg|file.dxf>')
    process.exit(1)
  }

  const ext = filePath.toLowerCase().split('.').pop()

  let result
  if (ext === 'dwg') {
    const parser = new DwgParser()
    result = await parser.parseFile(filePath)
  } else if (ext === 'dxf') {
    const parser = new DxfNativeParser()
    result = await parser.parseFile(filePath)
  } else {
    console.error(`Unsupported extension: .${ext}`)
    process.exit(1)
  }

  console.log('=== PARSED CONTENT ===')
  console.log(result.content)
  console.log('\n=== METADATA ===')
  console.log(JSON.stringify(result.metadata, null, 2))
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
