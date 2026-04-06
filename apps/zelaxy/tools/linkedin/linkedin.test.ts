/**
 * Tests for LinkedIn tool configurations
 *
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'
import { linkedinCreatePostTool } from '@/tools/linkedin/create-post'
import { linkedinGetProfileTool } from '@/tools/linkedin/get-profile'
import { linkedinGetCompanyTool } from '@/tools/linkedin/get-company'
import { linkedinDeletePostTool } from '@/tools/linkedin/delete-post'

describe('LinkedIn Create Post Tool', () => {
  it('should have correct tool id', () => {
    expect(linkedinCreatePostTool.id).toBe('linkedin_create_post')
  })

  it('should require OAuth with linkedin provider', () => {
    expect(linkedinCreatePostTool.oauth?.required).toBe(true)
    expect(linkedinCreatePostTool.oauth?.provider).toBe('linkedin')
  })

  it('should have accessToken as hidden param', () => {
    expect(linkedinCreatePostTool.params.accessToken.visibility).toBe('hidden')
    expect(linkedinCreatePostTool.params.accessToken.required).toBe(true)
  })

  it('should have text as required param', () => {
    expect(linkedinCreatePostTool.params.text.required).toBe(true)
  })

  it('should set correct request URL and method', () => {
    expect(linkedinCreatePostTool.request.url).toBe('https://api.linkedin.com/v2/ugcPosts')
    expect(linkedinCreatePostTool.request.method).toBe('POST')
  })

  it('should set Authorization header from accessToken', () => {
    const headersFn = linkedinCreatePostTool.request.headers as Function
    const headers = headersFn({ accessToken: 'test-token' })
    expect(headers.Authorization).toBe('Bearer test-token')
    expect(headers['X-Restli-Protocol-Version']).toBe('2.0.0')
  })

  it('should build body with personal author when no organizationId', () => {
    const bodyFn = linkedinCreatePostTool.request.body as Function
    const body = bodyFn({ text: 'Hello LinkedIn', accessToken: 'tok' })
    expect(body.author).toBe('urn:li:person:{owner}')
    expect(body.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text).toBe(
      'Hello LinkedIn'
    )
    expect(body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory).toBe('NONE')
  })

  it('should build body with organization author when organizationId provided', () => {
    const bodyFn = linkedinCreatePostTool.request.body as Function
    const body = bodyFn({ text: 'Company post', accessToken: 'tok', organizationId: '12345' })
    expect(body.author).toBe('urn:li:organization:12345')
  })

  it('should include media when mediaUrl provided', () => {
    const bodyFn = linkedinCreatePostTool.request.body as Function
    const body = bodyFn({
      text: 'Check this out',
      accessToken: 'tok',
      mediaUrl: 'https://example.com',
      mediaTitle: 'Example',
      mediaDescription: 'A description',
    })
    expect(body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory).toBe(
      'ARTICLE'
    )
    const media = body.specificContent['com.linkedin.ugc.ShareContent'].media
    expect(media).toHaveLength(1)
    expect(media[0].originalUrl).toBe('https://example.com')
    expect(media[0].title.text).toBe('Example')
  })

  it('should set CONNECTIONS visibility when specified', () => {
    const bodyFn = linkedinCreatePostTool.request.body as Function
    const body = bodyFn({ text: 'Test', accessToken: 'tok', visibility: 'CONNECTIONS' })
    expect(body.visibility['com.linkedin.ugc.MemberNetworkVisibility']).toBe('CONNECTIONS')
  })

  it('should transform successful response', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ id: 'urn:li:ugcPost:123' }),
    } as Response
    const result = await linkedinCreatePostTool.transformResponse!(mockResponse)
    expect(result.success).toBe(true)
    expect(result.output.post.id).toBe('urn:li:ugcPost:123')
  })

  it('should throw on error response', async () => {
    const mockResponse = {
      ok: false,
      statusText: 'Forbidden',
      json: () => Promise.resolve({ message: 'Insufficient permissions' }),
    } as unknown as Response
    await expect(linkedinCreatePostTool.transformResponse!(mockResponse)).rejects.toThrow(
      'Insufficient permissions'
    )
  })
})

describe('LinkedIn Get Profile Tool', () => {
  it('should have correct tool id', () => {
    expect(linkedinGetProfileTool.id).toBe('linkedin_get_profile')
  })

  it('should require OAuth with linkedin provider', () => {
    expect(linkedinGetProfileTool.oauth?.required).toBe(true)
    expect(linkedinGetProfileTool.oauth?.provider).toBe('linkedin')
  })

  it('should use correct API URL', () => {
    expect(linkedinGetProfileTool.request.url).toBe('https://api.linkedin.com/v2/userinfo')
    expect(linkedinGetProfileTool.request.method).toBe('GET')
  })

  it('should transform profile response', async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          sub: 'user123',
          given_name: 'John',
          family_name: 'Doe',
          name: 'John Doe',
          email: 'john@example.com',
          picture: 'https://example.com/photo.jpg',
        }),
    } as Response
    const result = await linkedinGetProfileTool.transformResponse!(mockResponse)
    expect(result.success).toBe(true)
    expect(result.output.profile.id).toBe('user123')
    expect(result.output.profile.localizedFirstName).toBe('John')
    expect(result.output.profile.localizedLastName).toBe('Doe')
    expect(result.output.profile.profilePicture).toBe('https://example.com/photo.jpg')
  })

  it('should throw on error response', async () => {
    const mockResponse = {
      ok: false,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ message: 'Invalid token' }),
    } as unknown as Response
    await expect(linkedinGetProfileTool.transformResponse!(mockResponse)).rejects.toThrow(
      'Invalid token'
    )
  })
})

describe('LinkedIn Get Company Tool', () => {
  it('should have correct tool id', () => {
    expect(linkedinGetCompanyTool.id).toBe('linkedin_get_company')
  })

  it('should require OAuth with linkedin provider', () => {
    expect(linkedinGetCompanyTool.oauth?.required).toBe(true)
    expect(linkedinGetCompanyTool.oauth?.provider).toBe('linkedin')
  })

  it('should build URL with organization ID', () => {
    const urlFn = linkedinGetCompanyTool.request.url as Function
    const url = urlFn({ organizationId: '98765', accessToken: 'tok' })
    expect(url).toBe('https://api.linkedin.com/rest/organizations/98765')
  })

  it('should set correct headers', () => {
    const headersFn = linkedinGetCompanyTool.request.headers as Function
    const headers = headersFn({ accessToken: 'test-token' })
    expect(headers.Authorization).toBe('Bearer test-token')
    expect(headers['X-Restli-Protocol-Version']).toBe('2.0.0')
    expect(headers['LinkedIn-Version']).toBe('202401')
  })

  it('should transform company response', async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          id: 98765,
          localizedName: 'Acme Corp',
          vanityName: 'acme',
          localizedDescription: 'A great company',
          websiteUrl: 'https://acme.com',
          staffCount: 500,
          industries: ['Technology'],
        }),
    } as Response
    const result = await linkedinGetCompanyTool.transformResponse!(mockResponse)
    expect(result.success).toBe(true)
    expect(result.output.organization.localizedName).toBe('Acme Corp')
    expect(result.output.organization.staffCount).toBe(500)
    expect(result.output.organization.websiteUrl).toBe('https://acme.com')
  })
})

describe('LinkedIn Delete Post Tool', () => {
  it('should have correct tool id', () => {
    expect(linkedinDeletePostTool.id).toBe('linkedin_delete_post')
  })

  it('should require OAuth with linkedin provider', () => {
    expect(linkedinDeletePostTool.oauth?.required).toBe(true)
    expect(linkedinDeletePostTool.oauth?.provider).toBe('linkedin')
  })

  it('should build URL with encoded post ID', () => {
    const urlFn = linkedinDeletePostTool.request.url as Function
    const url = urlFn({ postId: 'urn:li:share:123456', accessToken: 'tok' })
    expect(url).toContain('urn%3Ali%3Ashare%3A123456')
  })

  it('should use DELETE method', () => {
    expect(linkedinDeletePostTool.request.method).toBe('DELETE')
  })

  it('should transform successful delete response', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({}),
    } as Response
    const result = await linkedinDeletePostTool.transformResponse!(
      mockResponse,
      { postId: 'urn:li:share:123456', accessToken: 'tok' }
    )
    expect(result.success).toBe(true)
    expect(result.output.deleted).toBe(true)
    expect(result.output.postId).toBe('urn:li:share:123456')
  })

  it('should throw on error response', async () => {
    const mockResponse = {
      ok: false,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'Post not found' }),
    } as unknown as Response
    await expect(
      linkedinDeletePostTool.transformResponse!(mockResponse, {
        postId: 'urn:li:share:999',
        accessToken: 'tok',
      })
    ).rejects.toThrow('Post not found')
  })
})
