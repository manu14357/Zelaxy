import { type NextRequest, NextResponse } from 'next/server'
import { connectSftp, describeSftpError, validateConnection } from '@/app/api/tools/sftp/connect'
import type { SftpPutParams, SftpPutResponse } from '@/tools/sftp/types'

export async function POST(request: NextRequest) {
  let client: Awaited<ReturnType<typeof connectSftp>> | undefined
  try {
    const params: SftpPutParams = await request.json()

    const errors = validateConnection(params)
    if (!params.path) errors.push('Remote path is required')
    if (params.content === undefined || params.content === null) {
      errors.push('Content is required')
    }
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        output: { error: `Validation failed: ${errors.join(', ')}` },
      } satisfies SftpPutResponse)
    }

    const encoding = params.encoding === 'base64' ? 'base64' : 'utf8'
    const buffer = Buffer.from(String(params.content), encoding)

    client = await connectSftp(params)
    await client.put(buffer, params.path)

    return NextResponse.json({
      success: true,
      output: {
        path: params.path,
        bytesWritten: buffer.length,
        status: `Uploaded ${buffer.length} bytes to ${params.path}`,
      },
    } satisfies SftpPutResponse)
  } catch (error) {
    return NextResponse.json({
      success: false,
      output: { error: describeSftpError(error) },
    } satisfies SftpPutResponse)
  } finally {
    if (client) await client.end().catch(() => {})
  }
}
