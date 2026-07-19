import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { encodeS3PathComponent } from '@/tools/s3/utils'

const logger = createLogger('S3PutObjectAPI')

export const dynamic = 'force-dynamic'

/**
 * Unauthenticated internal proxy for S3 uploads.
 *
 * This route deliberately does NOT call getSession(): the user's own AWS credentials
 * (passed in the body) are the auth boundary, and requiring a session would break
 * worker-side / scheduled execution. This mirrors the pulse/parse precedent.
 *
 * Uploading directly from the tool runtime is not possible because the runtime
 * JSON.stringifies request bodies, corrupting binary bytes and the SigV4 content hash.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { region, accessKeyId, secretAccessKey, bucket, key, content, contentType } = body

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: 'AWS credentials are required' }, { status: 400 })
    }
    if (!bucket) {
      return NextResponse.json({ error: 'Bucket is required' }, { status: 400 })
    }
    if (!key) {
      return NextResponse.json({ error: 'Object key is required' }, { status: 400 })
    }
    if (content === undefined || content === null) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const resolvedRegion = region || 'us-east-1'

    const client = new S3Client({
      region: resolvedRegion,
      credentials: { accessKeyId, secretAccessKey },
    })

    const result = await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: typeof content === 'string' ? content : String(content),
        ContentType: contentType || 'application/octet-stream',
      })
    )

    const location = `https://${bucket}.s3.${resolvedRegion}.amazonaws.com/${encodeS3PathComponent(key)}`

    return NextResponse.json({
      success: true,
      output: {
        location,
        bucket,
        key,
        etag: result.ETag ? result.ETag.replace(/"/g, '') : '',
        versionId: result.VersionId ?? null,
      },
    })
  } catch (error: any) {
    logger.error('S3 put object error', { error: error?.message })
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
