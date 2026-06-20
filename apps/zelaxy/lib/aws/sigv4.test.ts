import { describe, expect, it } from 'vitest'
import { signAwsV4 } from '@/lib/aws/sigv4'

describe('AWS SigV4 signer', () => {
  // AWS official "get-vanilla" test-suite vector.
  // https://docs.aws.amazon.com/general/latest/gr/signature-v4-test-suite.html
  it('matches the AWS get-vanilla signature vector', () => {
    const headers = signAwsV4({
      method: 'GET',
      url: 'https://example.amazonaws.com/',
      region: 'us-east-1',
      service: 'service',
      accessKeyId: 'AKIDEXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
      amzDate: '20150830T123600Z',
    })

    expect(headers.Authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, ' +
        'SignedHeaders=host;x-amz-date, ' +
        'Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31'
    )
    expect(headers['X-Amz-Date']).toBe('20150830T123600Z')
  })

  it('signs a JSON body and includes extra signed headers (e.g. X-Amz-Target)', () => {
    const headers = signAwsV4({
      method: 'POST',
      url: 'https://textract.us-east-1.amazonaws.com/',
      region: 'us-east-1',
      service: 'textract',
      accessKeyId: 'AKIDEXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'Textract.DetectDocumentText',
      },
      body: JSON.stringify({ Document: { S3Object: { Bucket: 'b', Name: 'n' } } }),
      amzDate: '20150830T123600Z',
    })

    // Deterministic given the fixed amzDate — pins the canonicalisation of body + extra headers.
    expect(headers.Authorization).toContain('AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/')
    expect(headers.Authorization).toContain(
      'SignedHeaders=content-type;host;x-amz-date;x-amz-target'
    )
    expect(headers['X-Amz-Content-Sha256']).toMatch(/^[a-f0-9]{64}$/)
  })
})
