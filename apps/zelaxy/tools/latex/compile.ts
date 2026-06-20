import type { CompileParams, LatexCompileResponse, LatexResource } from '@/tools/latex/types'
import type { ToolConfig } from '@/tools/types'

export const compileTool: ToolConfig<CompileParams, LatexCompileResponse> = {
  id: 'latex_compile',
  name: 'LaTeX Compile',
  description:
    'Compile a LaTeX document into a PDF via the public LaTeX-on-HTTP service (latex.ytotech.com/builds/sync). Supports pdflatex, xelatex, lualatex, platex, uplatex, and context.',
  version: '1.0.0',

  params: {
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'LaTeX source of the main document, from \\documentclass to \\end{document}',
    },
    compiler: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description:
        'LaTeX compiler: pdflatex (default), xelatex, lualatex, platex, uplatex, or context',
    },
    resources: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description:
        'Additional supporting files. Each entry has a "path" plus one of "content", "file" (base64), or "url", e.g. [{"path":"refs.bib","content":"..."}]',
    },
  },

  request: {
    url: 'https://latex.ytotech.com/builds/sync',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
    }),
    body: (params) => {
      const resources: LatexResource[] = [{ main: true, content: params.content }]
      if (Array.isArray(params.resources)) {
        for (const resource of params.resources) resources.push(resource)
      }
      return {
        compiler: params.compiler || 'pdflatex',
        resources,
      }
    },
  },

  transformResponse: async (response, params) => {
    const buffer = Buffer.from(await response.arrayBuffer())
    const pdfBase64 = buffer.toString('base64')
    return {
      success: true,
      output: {
        data: { pdfBase64, dataUrl: `data:application/pdf;base64,${pdfBase64}` },
        metadata: { compiler: params?.compiler || 'pdflatex', status: response.status },
      },
    }
  },

  outputs: {
    data: {
      type: 'json',
      description: 'Compiled PDF',
      properties: {
        pdfBase64: { type: 'string', description: 'Base64-encoded PDF bytes' },
        dataUrl: { type: 'string', description: 'Base64 data URL of the PDF' },
      },
    },
    metadata: {
      type: 'json',
      description: 'Compilation metadata',
      properties: {
        compiler: { type: 'string', description: 'LaTeX compiler used for the build' },
        status: { type: 'number', description: 'HTTP status code returned by the service' },
      },
    },
  },
}
