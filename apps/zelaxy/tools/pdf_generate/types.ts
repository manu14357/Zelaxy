export interface PdfGenerateParams {
  title?: string
  content: string
}

export interface PdfGenerateOutput {
  base64: string
  filename: string
  mimeType: string
}
