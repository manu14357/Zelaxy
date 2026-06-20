import { LatexIcon } from '@/components/icons/latex-icon'
import type { BlockConfig } from '@/blocks/types'
import type { LatexResponse } from '@/tools/latex/types'

export const LatexBlock: BlockConfig<LatexResponse> = {
  type: 'latex',
  name: 'LaTeX',
  description: 'Compile LaTeX to PDF and search TeX Live packages',
  longDescription:
    'Compile LaTeX source into a PDF and search available TeX Live packages using the public LaTeX-on-HTTP service (latex.ytotech.com). No authentication required.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#008080',
  icon: LatexIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Compile', id: 'latex_compile' },
        { label: 'Search packages', id: 'latex_search_packages' },
      ],
      value: () => 'latex_compile',
    },
    // Compile
    {
      id: 'content',
      title: 'LaTeX Source',
      type: 'long-input',
      layout: 'full',
      placeholder: '\\documentclass{article}\\begin{document}Hello\\end{document}',
      condition: { field: 'operation', value: 'latex_compile' },
    },
    {
      id: 'compiler',
      title: 'Compiler',
      type: 'short-input',
      layout: 'half',
      placeholder: 'pdflatex',
      condition: { field: 'operation', value: 'latex_compile' },
    },
    {
      id: 'resources',
      title: 'Resources',
      type: 'long-input',
      layout: 'full',
      placeholder: '[{"path":"refs.bib","content":"..."}]',
      condition: { field: 'operation', value: 'latex_compile' },
    },
    // Search packages
    {
      id: 'query',
      title: 'Query',
      type: 'short-input',
      layout: 'full',
      placeholder: 'tikz',
      condition: { field: 'operation', value: 'latex_search_packages' },
    },
  ],
  tools: {
    access: ['latex_compile', 'latex_search_packages'],
    config: {
      tool: (params) => params.operation || 'latex_compile',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    content: { type: 'string', description: 'LaTeX source of the main document' },
    compiler: { type: 'string', description: 'LaTeX compiler to use' },
    resources: { type: 'json', description: 'Additional supporting files' },
    query: { type: 'string', description: 'Package search query' },
  },
  outputs: {
    data: { type: 'json', description: 'Compiled PDF or matching packages' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
