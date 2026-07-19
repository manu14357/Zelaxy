import { type NextRequest, NextResponse } from 'next/server'
import { connectSftp, describeSftpError, validateConnection } from '@/app/api/tools/sftp/connect'
import type { SftpDeleteParams, SftpDeleteResponse } from '@/tools/sftp/types'

export async function POST(request: NextRequest) {
  let client: Awaited<ReturnType<typeof connectSftp>> | undefined
  try {
    const params: SftpDeleteParams = await request.json()

    const errors = validateConnection(params)
    if (!params.path) errors.push('Remote path is required')
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        output: { error: `Validation failed: ${errors.join(', ')}` },
      } satisfies SftpDeleteResponse)
    }

    client = await connectSftp(params)
    await client.delete(params.path)

    return NextResponse.json({
      success: true,
      output: { path: params.path, status: `Deleted ${params.path}` },
    } satisfies SftpDeleteResponse)
  } catch (error) {
    return NextResponse.json({
      success: false,
      output: { error: describeSftpError(error) },
    } satisfies SftpDeleteResponse)
  } finally {
    if (client) await client.end().catch(() => {})
  }
}
