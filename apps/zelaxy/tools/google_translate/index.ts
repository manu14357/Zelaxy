import { detectLanguageTool } from '@/tools/google_translate/detect_language'
import { listLanguagesTool } from '@/tools/google_translate/list_languages'
import { translateTool } from '@/tools/google_translate/translate'

export const googleTranslateTranslateTool = translateTool
export const googleTranslateDetectLanguageTool = detectLanguageTool
export const googleTranslateListLanguagesTool = listLanguagesTool
