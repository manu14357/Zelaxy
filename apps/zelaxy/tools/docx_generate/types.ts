export interface DocxGenerateParams {
  title?: string
  content: string
}

export interface DocxGenerateOutput {
  base64: string
  filename: string
  mimeType: string
}
