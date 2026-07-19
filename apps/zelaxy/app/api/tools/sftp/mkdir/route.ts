import { type NextRequest, NextResponse } from 'next/server'
import { connectSftp, describeSftpError, validateConnection } from '@/app/api/tools/sftp/connect'
import type { SftpMkdirParams, SftpMkdirResponse } from '@/tools/sftp/types'

export async function POST(request: NextRequest) {
  let client: Awaited<ReturnType<typeof connectSftp>> | undefined
  try {
    const params: SftpMkdirParams = await request.json()

    const errors = validateConnection(params)
    if (!params.path) errors.push('Remote path is required')
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        output: { error: `Validation failed: ${errors.join(', ')}` },
      } satisfies SftpMkdirResponse)
    }

    const recursive = params.recursive !== false

    client = await connectSftp(params)
    await client.mkdir(params.path, recursive)

    return NextResponse.json({
      success: true,
      output: { path: params.path, status: `Created directory ${params.path}` },
    } satisfies SftpMkdirResponse)
  } catch (error) {
    return NextResponse.json({
      success: false,
      output: { error: describeSftpError(error) },
    } satisfies SftpMkdirResponse)
  } finally {
    if (client) await client.end().catch(() => {})
  }
}
