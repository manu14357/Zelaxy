/**
 * Request-builder tests for the Box tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { boxCreateFolderTool } from '@/tools/box/create_folder'
import { boxCreateSharedLinkTool } from '@/tools/box/create_shared_link'
import { boxDeleteFileTool } from '@/tools/box/delete_file'
import { boxDownloadFileTool } from '@/tools/box/download_file'
import { boxGetFileInfoTool } from '@/tools/box/get_file_info'
import { boxListFolderTool } from '@/tools/box/list_folder'
import { boxUploadFileTool } from '@/tools/box/upload_file'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  organization: 'org',
  project: 'proj',
  pipelineId: 'pl',
  runId: 'r',
  workItemId: '1',
  id: 'id',
  fileId: 'f',
  folderId: '0',
  brandId: 'b',
  domain: 'x.com',
  query: 'q',
  webhookURL: 'https://clay.example/webhook',
  bookingUid: 'bk',
  eventTypeId: 'et',
  uuid: 'uid',
  uri: 'https://api.calendly.com/x',
  userUri: 'https://api.calendly.com/u',
  inviteeUuid: 'iv',
  secretId: 's',
  taskId: 't',
}

describe('Box tools', () => {
  it('box_create_folder: builds its request', () => {
    expect(boxCreateFolderTool.id).toBe('box_create_folder')
    expect(boxCreateFolderTool.request.method).toBe('POST')
    const u =
      typeof boxCreateFolderTool.request.url === 'function'
        ? (boxCreateFolderTool.request.url as any)(P)
        : boxCreateFolderTool.request.url
    expect(String(u)).toContain('api.box.com/2.0')
    expect(Object.keys(boxCreateFolderTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof boxCreateFolderTool.transformResponse).toBe('function')
  })

  it('box_create_shared_link: builds its request', () => {
    expect(boxCreateSharedLinkTool.id).toBe('box_create_shared_link')
    expect(boxCreateSharedLinkTool.request.method).toBe('PUT')
    const u =
      typeof boxCreateSharedLinkTool.request.url === 'function'
        ? (boxCreateSharedLinkTool.request.url as any)(P)
        : boxCreateSharedLinkTool.request.url
    expect(String(u)).toContain('api.box.com/2.0')
    expect(Object.keys(boxCreateSharedLinkTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof boxCreateSharedLinkTool.transformResponse).toBe('function')
  })

  it('box_delete_file: builds its request', () => {
    expect(boxDeleteFileTool.id).toBe('box_delete_file')
    expect(boxDeleteFileTool.request.method).toBe('DELETE')
    const u =
      typeof boxDeleteFileTool.request.url === 'function'
        ? (boxDeleteFileTool.request.url as any)(P)
        : boxDeleteFileTool.request.url
    expect(String(u)).toContain('api.box.com/2.0')
    expect(Object.keys(boxDeleteFileTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof boxDeleteFileTool.transformResponse).toBe('function')
  })

  it('box_download_file: builds its request', () => {
    expect(boxDownloadFileTool.id).toBe('box_download_file')
    expect(boxDownloadFileTool.request.method).toBe('GET')
    const u =
      typeof boxDownloadFileTool.request.url === 'function'
        ? (boxDownloadFileTool.request.url as any)(P)
        : boxDownloadFileTool.request.url
    expect(String(u)).toContain('api.box.com/2.0')
    expect(Object.keys(boxDownloadFileTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof boxDownloadFileTool.transformResponse).toBe('function')
  })

  it('box_get_file_info: builds its request', () => {
    expect(boxGetFileInfoTool.id).toBe('box_get_file_info')
    expect(boxGetFileInfoTool.request.method).toBe('GET')
    const u =
      typeof boxGetFileInfoTool.request.url === 'function'
        ? (boxGetFileInfoTool.request.url as any)(P)
        : boxGetFileInfoTool.request.url
    expect(String(u)).toContain('api.box.com/2.0')
    expect(Object.keys(boxGetFileInfoTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof boxGetFileInfoTool.transformResponse).toBe('function')
  })

  it('box_list_folder: builds its request', () => {
    expect(boxListFolderTool.id).toBe('box_list_folder')
    expect(boxListFolderTool.request.method).toBe('GET')
    const u =
      typeof boxListFolderTool.request.url === 'function'
        ? (boxListFolderTool.request.url as any)(P)
        : boxListFolderTool.request.url
    expect(String(u)).toContain('api.box.com/2.0')
    expect(Object.keys(boxListFolderTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof boxListFolderTool.transformResponse).toBe('function')
  })

  it('box_upload_file: builds its request', () => {
    expect(boxUploadFileTool.id).toBe('box_upload_file')
    expect(boxUploadFileTool.request.method).toBe('POST')
    const u =
      typeof boxUploadFileTool.request.url === 'function'
        ? (boxUploadFileTool.request.url as any)(P)
        : boxUploadFileTool.request.url
    expect(String(u)).toContain('/api/tools/box/upload')
    expect(Object.keys(boxUploadFileTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof boxUploadFileTool.transformResponse).toBe('function')
  })
})
