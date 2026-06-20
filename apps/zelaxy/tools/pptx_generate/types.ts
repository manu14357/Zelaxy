export interface PptxGenerateParams {
  title?: string
  slides: string
}

export interface PptxGenerateOutput {
  base64: string
  filename: string
  mimeType: string
}
