import { type NextRequest, NextResponse } from 'next/server'
import { connectSftp, describeSftpError, validateConnection } from '@/app/api/tools/sftp/connect'
import type { SftpListParams, SftpListResponse } from '@/tools/sftp/types'

export async function POST(request: NextRequest) {
  let client: Awaited<ReturnType<typeof connectSftp>> | undefined
  try {
    const params: SftpListParams = await request.json()

    const errors = validateConnection(params)
    if (!params.path) errors.push('Remote path is required')
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        output: { error: `Validation failed: ${errors.join(', ')}` },
      } satisfies SftpListResponse)
    }

    client = await connectSftp(params)
    const entries = await client.list(params.path)

    const files = entries.map((e: any) => ({
      name: e.name,
      type: e.type,
      size: e.size,
      modifyTime: e.modifyTime,
      accessTime: e.accessTime,
      rights: e.rights,
      owner: e.owner,
      group: e.group,
    }))

    return NextResponse.json({
      success: true,
      output: { path: params.path, files, count: files.length },
    } satisfies SftpListResponse)
  } catch (error) {
    return NextResponse.json({
      success: false,
      output: { error: describeSftpError(error) },
    } satisfies SftpListResponse)
  } finally {
    if (client) await client.end().catch(() => {})
  }
}
