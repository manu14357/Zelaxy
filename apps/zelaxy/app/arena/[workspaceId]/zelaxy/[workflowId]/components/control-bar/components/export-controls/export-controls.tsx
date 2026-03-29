'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createLogger } from '@/lib/logs/console/logger'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useWorkflowYamlStore } from '@/stores/workflows/yaml/store'

const logger = createLogger('ExportControls')

interface ExportControlsProps {
  disabled?: boolean
}

export function ExportControls({ disabled = false }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { workflows, activeWorkflowId } = useWorkflowRegistry()
  const getYaml = useWorkflowYamlStore((state) => state.getYaml)

  const currentWorkflow = activeWorkflowId ? workflows[activeWorkflowId] : null

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Failed to download file:', error)
    }
  }

  const handleExportYaml = async () => {
    if (!currentWorkflow || !activeWorkflowId) {
      logger.warn('No active workflow to export')
      return
    }

    setIsExporting(true)
    try {
      const yamlContent = await getYaml()

      if (!yamlContent) {
        logger.error('Failed to generate YAML content')
        return
      }

      const filename = `${currentWorkflow.name.replace(/[^a-z0-9]/gi, '-')}.yaml`

      downloadFile(yamlContent, filename, 'text/yaml')
      logger.info('Workflow exported as YAML successfully')
    } catch (error) {
      logger.error('Failed to export workflow as YAML:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const isDisabled = disabled || isExporting || !currentWorkflow

  const getTooltipText = () => {
    if (disabled) return 'Export unavailable'
    if (!currentWorkflow) return 'No workflow'
    if (isExporting) return 'Exporting...'
    return 'Export YAML'
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isDisabled ? (
          <div className='inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full border border-gray-200 bg-transparent text-gray-400 opacity-50 transition-colors sm:h-9 sm:w-9 dark:border-gray-700 dark:text-gray-600'>
            <Download className='h-3 w-3 sm:h-4 sm:w-4' />
          </div>
        ) : (
          <Button
            variant='ghost'
            onClick={handleExportYaml}
            className='h-7 w-7 rounded-full border border-gray-300 bg-transparent text-gray-600 transition-all duration-200 hover:border-primary hover:text-primary sm:h-9 sm:w-9 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary dark:hover:text-primary/80'
          >
            <Download className='h-3 w-3 sm:h-4 sm:w-4' />
            <span className='sr-only'>Export YAML</span>
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>{getTooltipText()}</TooltipContent>
    </Tooltip>
  )
}
