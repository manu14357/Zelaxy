import { batchUpdateTool } from '@/tools/google_slides/batch_update'
import { createPresentationTool } from '@/tools/google_slides/create_presentation'
import { getPresentationTool } from '@/tools/google_slides/get_presentation'

export const googleSlidesGetPresentationTool = getPresentationTool
export const googleSlidesCreatePresentationTool = createPresentationTool
export const googleSlidesBatchUpdateTool = batchUpdateTool
