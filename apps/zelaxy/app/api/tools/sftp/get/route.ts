import { type NextRequest, NextResponse } from 'next/server'
import { connectSftp, describeSftpError, validateConnection } from '@/app/api/tools/sftp/connect'
import type { SftpGetParams, SftpGetResponse } from '@/tools/sftp/types'

export async function POST(request: NextRequest) {
  let client: Awaited<ReturnType<typeof connectSftp>> | undefined
  try {
    const params: SftpGetParams = await request.json()

    const errors = validateConnection(params)
    if (!params.path) errors.push('Remote path is required')
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        output: { error: `Validation failed: ${errors.join(', ')}` },
      } satisfies SftpGetResponse)
    }

    const encoding = params.encoding === 'base64' ? 'base64' : 'utf8'

    client = await connectSftp(params)
    // With no destination, get() resolves to a Buffer of the file contents.
    const data = (await client.get(params.path)) as Buffer
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as unknown as string)

    return NextResponse.json({
      success: true,
      output: {
        path: params.path,
        content: buffer.toString(encoding),
        encoding,
        size: buffer.length,
      },
    } satisfies SftpGetResponse)
  } catch (error) {
    return NextResponse.json({
      success: false,
      output: { error: describeSftpError(error) },
    } satisfies SftpGetResponse)
  } finally {
    if (client) await client.end().catch(() => {})
  }
}
