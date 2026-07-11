/**
 * Request-builder tests for the Dropbox tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { dropboxCreateFolderTool } from '@/tools/dropbox/create_folder'
import { dropboxCreateSharedLinkTool } from '@/tools/dropbox/create_shared_link'
import { dropboxDeleteFileTool } from '@/tools/dropbox/delete_file'
import { dropboxDownloadFileTool } from '@/tools/dropbox/download_file'
import { dropboxGetFileMetadataTool } from '@/tools/dropbox/get_file_metadata'
import { dropboxListFolderTool } from '@/tools/dropbox/list_folder'
import { dropboxSearchFilesTool } from '@/tools/dropbox/search_files'
import { dropboxUploadFileTool } from '@/tools/dropbox/upload_file'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  host: 'https://myws.databricks.com',
  site: 'datadoghq.com',
  runId: 'r',
  jobId: 'j',
  clusterId: 'c',
  catalogName: 'cat',
  monitorId: 'm',
  incidentId: 'i',
  dashboardId: 'd',
  workspaceId: 'w',
  sessionId: 's',
  secretName: 'sec',
  snapshotId: 'sn',
  channelId: 'ch',
  guildId: 'g',
  serverId: 'sv',
  userId: 'u',
  envelopeId: 'e',
  accountId: 'a',
  path: '/p',
  fileId: 'f',
  folderId: '0',
  query: 'q',
  personId: 'p',
  email: 'e@x.com',
  fullName: 'n',
  repositoryLocationName: 'rl',
  repositoryName: 'rn',
  jobName: 'jn',
  sql: 'SELECT 1',
  warehouseId: 'wh',
  id: 'id',
  name: 'n',
  message: 'm',
}

describe('Dropbox tools', () => {
  it('dropbox_create_folder: builds its request', () => {
    expect(dropboxCreateFolderTool.id).toBe('dropbox_create_folder')
    expect(dropboxCreateFolderTool.request.method).toBe('POST')
    const u =
      typeof dropboxCreateFolderTool.request.url === 'function'
        ? (dropboxCreateFolderTool.request.url as any)(P)
        : dropboxCreateFolderTool.request.url
    expect(String(u)).toContain('dropbox')
    expect(Object.keys(dropboxCreateFolderTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dropboxCreateFolderTool.transformResponse).toBe('function')
  })

  it('dropbox_create_shared_link: builds its request', () => {
    expect(dropboxCreateSharedLinkTool.id).toBe('dropbox_create_shared_link')
    expect(dropboxCreateSharedLinkTool.request.method).toBe('POST')
    const u =
      typeof dropboxCreateSharedLinkTool.request.url === 'function'
        ? (dropboxCreateSharedLinkTool.request.url as any)(P)
        : dropboxCreateSharedLinkTool.request.url
    expect(String(u)).toContain('dropbox')
    expect(Object.keys(dropboxCreateSharedLinkTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dropboxCreateSharedLinkTool.transformResponse).toBe('function')
  })

  it('dropbox_delete_file: builds its request', () => {
    expect(dropboxDeleteFileTool.id).toBe('dropbox_delete_file')
    expect(dropboxDeleteFileTool.request.method).toBe('POST')
    const u =
      typeof dropboxDeleteFileTool.request.url === 'function'
        ? (dropboxDeleteFileTool.request.url as any)(P)
        : dropboxDeleteFileTool.request.url
    expect(String(u)).toContain('dropbox')
    expect(Object.keys(dropboxDeleteFileTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dropboxDeleteFileTool.transformResponse).toBe('function')
  })

  it('dropbox_download_file: builds its request', () => {
    expect(dropboxDownloadFileTool.id).toBe('dropbox_download_file')
    expect(dropboxDownloadFileTool.request.method).toBe('POST')
    const u =
      typeof dropboxDownloadFileTool.request.url === 'function'
        ? (dropboxDownloadFileTool.request.url as any)(P)
        : dropboxDownloadFileTool.request.url
    expect(String(u)).toContain('dropbox')
    expect(Object.keys(dropboxDownloadFileTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dropboxDownloadFileTool.transformResponse).toBe('function')
  })

  it('dropbox_get_file_metadata: builds its request', () => {
    expect(dropboxGetFileMetadataTool.id).toBe('dropbox_get_file_metadata')
    expect(dropboxGetFileMetadataTool.request.method).toBe('POST')
    const u =
      typeof dropboxGetFileMetadataTool.request.url === 'function'
        ? (dropboxGetFileMetadataTool.request.url as any)(P)
        : dropboxGetFileMetadataTool.request.url
    expect(String(u)).toContain('dropbox')
    expect(Object.keys(dropboxGetFileMetadataTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dropboxGetFileMetadataTool.transformResponse).toBe('function')
  })

  it('dropbox_list_folder: builds its request', () => {
    expect(dropboxListFolderTool.id).toBe('dropbox_list_folder')
    expect(dropboxListFolderTool.request.method).toBe('POST')
    const u =
      typeof dropboxListFolderTool.request.url === 'function'
        ? (dropboxListFolderTool.request.url as any)(P)
        : dropboxListFolderTool.request.url
    expect(String(u)).toContain('dropbox')
    expect(Object.keys(dropboxListFolderTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dropboxListFolderTool.transformResponse).toBe('function')
  })

  it('dropbox_search_files: builds its request', () => {
    expect(dropboxSearchFilesTool.id).toBe('dropbox_search_files')
    expect(dropboxSearchFilesTool.request.method).toBe('POST')
    const u =
      typeof dropboxSearchFilesTool.request.url === 'function'
        ? (dropboxSearchFilesTool.request.url as any)(P)
        : dropboxSearchFilesTool.request.url
    expect(String(u)).toContain('dropbox')
    expect(Object.keys(dropboxSearchFilesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dropboxSearchFilesTool.transformResponse).toBe('function')
  })

  it('dropbox_upload_file: builds its request', () => {
    expect(dropboxUploadFileTool.id).toBe('dropbox_upload_file')
    expect(dropboxUploadFileTool.request.method).toBe('POST')
    const u =
      typeof dropboxUploadFileTool.request.url === 'function'
        ? (dropboxUploadFileTool.request.url as any)(P)
        : dropboxUploadFileTool.request.url
    expect(String(u)).toContain('dropbox')
    expect(Object.keys(dropboxUploadFileTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dropboxUploadFileTool.transformResponse).toBe('function')
  })
})
