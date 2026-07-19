import { describe, expect, it } from 'vitest'
import { S3Block } from '@/blocks/blocks/s3'
import { tools } from '@/tools/registry'
import { s3GetObjectTool } from '@/tools/s3/get_object'
import { s3PutObjectTool } from '@/tools/s3/put_object'

describe('s3PutObjectTool', () => {
  it('has the expected id and points at the internal proxy route', () => {
    expect(s3PutObjectTool.id).toBe('s3_put_object')
    expect(s3PutObjectTool.request.url).toBe('/api/tools/s3/put-object')
    expect(s3PutObjectTool.request.method).toBe('POST')
  })

  it('is registered under a key equal to its id', () => {
    expect(tools.s3_put_object).toBe(s3PutObjectTool)
    expect(tools.s3_get_object).toBe(s3GetObjectTool)
  })

  it('builds a JSON body with all the fields the route expects', () => {
    const body = s3PutObjectTool.request.body?.({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      region: 'eu-west-1',
      bucket: 'my-bucket',
      key: 'folder/file.txt',
      content: 'hello world',
      contentType: 'text/plain',
    })

    expect(body).toEqual({
      region: 'eu-west-1',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      bucket: 'my-bucket',
      key: 'folder/file.txt',
      content: 'hello world',
      contentType: 'text/plain',
    })
  })

  it('defaults region and contentType in the body', () => {
    const body = s3PutObjectTool.request.body?.({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      bucket: 'my-bucket',
      key: 'file.txt',
      content: 'data',
    } as any)

    expect(body?.region).toBe('us-east-1')
    expect(body?.contentType).toBe('application/octet-stream')
  })

  it('transformResponse returns success output on 200', async () => {
    const output = { location: 'https://x', bucket: 'b', key: 'k', etag: 'abc', versionId: null }
    const response = new Response(JSON.stringify({ success: true, output }), { status: 200 })

    const result = await s3PutObjectTool.transformResponse?.(response, {} as any)
    expect(result?.success).toBe(true)
    expect(result?.output).toEqual(output)
  })

  it('transformResponse surfaces the error on failure', async () => {
    const response = new Response(JSON.stringify({ error: 'Access Denied' }), { status: 403 })

    const result = await s3PutObjectTool.transformResponse?.(response, {} as any)
    expect(result?.success).toBe(false)
    expect(result?.error).toBe('Access Denied')
  })
})

describe('S3Block operation routing', () => {
  const cfg = S3Block.tools.config!

  it('registers both s3 tools in access', () => {
    expect(S3Block.tools.access).toContain('s3_get_object')
    expect(S3Block.tools.access).toContain('s3_put_object')
  })

  it('defaults the operation sub-block to get_object', () => {
    const op = S3Block.subBlocks.find((b) => b.id === 'operation')
    expect(op?.value?.({})).toBe('get_object')
  })

  it('resolves s3_get_object by default and when explicitly get_object', () => {
    expect(cfg.tool({})).toBe('s3_get_object')
    expect(cfg.tool({ operation: 'get_object' })).toBe('s3_get_object')
  })

  it('resolves s3_put_object for the put operation', () => {
    expect(cfg.tool({ operation: 'put_object' })).toBe('s3_put_object')
  })

  it('gates s3Uri on get_object and put fields on put_object', () => {
    const byId = (id: string) => S3Block.subBlocks.find((b) => b.id === id)
    expect(byId('s3Uri')?.condition).toEqual({ field: 'operation', value: 'get_object' })
    for (const id of ['bucket', 'key', 'content', 'contentType', 'region']) {
      expect(byId(id)?.condition).toEqual({ field: 'operation', value: 'put_object' })
    }
  })
})

describe('S3Block params (get_object) is byte-identical to legacy', () => {
  const cfg = S3Block.tools.config!

  it('parses an s3Uri into legacy shape', () => {
    const out = cfg.params!({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      s3Uri: 'https://my-bucket.s3.us-west-2.amazonaws.com/path/to/file.txt',
    })

    expect(out).toEqual({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      region: 'us-west-2',
      bucketName: 'my-bucket',
      objectKey: 'path/to/file.txt',
    })
  })

  it('throws when s3Uri is missing', () => {
    expect(() => cfg.params!({ accessKeyId: 'a', secretAccessKey: 'b' })).toThrow(
      'S3 Object URL is required'
    )
  })
})

describe('S3Block params (put_object)', () => {
  const cfg = S3Block.tools.config!

  it('returns the put param shape with defaults', () => {
    const out = cfg.params!({
      operation: 'put_object',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      bucket: 'my-bucket',
      key: 'a/b.txt',
      content: 'hi',
    })

    expect(out).toEqual({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      region: 'us-east-1',
      bucket: 'my-bucket',
      key: 'a/b.txt',
      content: 'hi',
      contentType: 'application/octet-stream',
    })
  })

  it('honors explicit region and contentType', () => {
    const out = cfg.params!({
      operation: 'put_object',
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      region: 'ap-south-1',
      bucket: 'my-bucket',
      key: 'a/b.json',
      content: '{}',
      contentType: 'application/json',
    })

    expect(out.region).toBe('ap-south-1')
    expect(out.contentType).toBe('application/json')
  })

  it('validates required put fields', () => {
    const base = {
      operation: 'put_object',
      accessKeyId: 'a',
      secretAccessKey: 'b',
      key: 'k',
      content: 'c',
    }
    expect(() => cfg.params!({ ...base, bucket: undefined })).toThrow('Bucket is required')
    expect(() => cfg.params!({ ...base, bucket: 'x', key: undefined })).toThrow(
      'Object Key is required'
    )
    expect(() => cfg.params!({ ...base, bucket: 'x', content: '' })).toThrow('Content is required')
  })
})
