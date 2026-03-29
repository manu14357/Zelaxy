import { BaseClient } from '../base'
import type { UploadedFile } from '../types'

export class FilesResource extends BaseClient {
  async upload(file: { name: string; content: Buffer; type: string }): Promise<UploadedFile> {
    const FormData = (await import('node-fetch')).FormData
    const { Blob } = await import('node-fetch')
    const form = new FormData()

    form.append('file', new Blob([new Uint8Array(file.content)], { type: file.type }), file.name)

    const response = await this.requestRaw('/api/files/upload', {
      method: 'POST',
      body: form as any,
    })

    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as any
      throw new Error(err.error || `Upload failed: ${response.status}`)
    }
    return (await response.json()) as UploadedFile
  }

  async delete_(fileId: string): Promise<void> {
    await this.del(`/api/files/delete?fileId=${fileId}`)
  }
}
