import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  getTemplateById,
  getTemplatesByCategory,
  getWorkflowTemplates,
  searchTemplates,
  suggestTemplates,
} from '@/lib/copilot/workflow-templates'

/**
 * GET /api/copilot/templates
 * Get workflow templates for Agie AI Copilot
 *
 * Query params:
 * - id: Get specific template by ID
 * - category: Filter by category (automation, integration, ai, notification, data)
 * - search: Search by name/description/tags
 * - suggest: Get AI-suggested templates based on intent
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const suggest = searchParams.get('suggest')

    // Get specific template by ID
    if (id) {
      const template = getTemplateById(id)
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json({ template })
    }

    // Filter by category
    if (category) {
      const validCategories = ['automation', 'integration', 'ai', 'notification', 'data']
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Invalid category', validCategories }, { status: 400 })
      }
      const templates = getTemplatesByCategory(category as any)
      return NextResponse.json({ templates, count: templates.length })
    }

    // Search templates
    if (search) {
      const templates = searchTemplates(search)
      return NextResponse.json({ templates, count: templates.length, query: search })
    }

    // Get suggested templates based on intent
    if (suggest) {
      const templates = suggestTemplates(suggest)
      return NextResponse.json({ templates, count: templates.length, intent: suggest })
    }

    // Return all templates
    const templates = getWorkflowTemplates()
    return NextResponse.json({
      templates,
      count: templates.length,
      categories: ['automation', 'integration', 'ai', 'notification', 'data'],
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}
