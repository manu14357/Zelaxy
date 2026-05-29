import type { SVGProps } from 'react'
import { createElement } from 'react'
import { Users } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const SixtyfourIcon = (props: SVGProps<SVGSVGElement>) => createElement(Users, props)

export const SixtyfourBlock: BlockConfig = {
  type: 'sixtyfour',
  name: '64',
  description: 'Find contact info and enrich leads with 64',
  longDescription:
    'Use 64 to find phone numbers, emails, and enrich leads or companies with structured data and AI-powered research.',
  docsLink: 'https://docs.zelaxy.ai/tools/sixtyfour',
  category: 'tools',
  bgColor: '#000000',
  icon: SixtyfourIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'Find Phone', id: 'find_phone' },
        { label: 'Find Email', id: 'find_email' },
        { label: 'Enrich Lead', id: 'enrich_lead' },
        { label: 'Enrich Company', id: 'enrich_company' },
      ],
      value: () => 'find_phone',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      placeholder: 'Enter your 64 API key',
      required: true,
      password: true,
    },
    {
      id: 'firstName',
      title: 'First Name',
      type: 'short-input',
      placeholder: 'First name',
      condition: { field: 'operation', value: ['find_phone', 'find_email'] },
    },
    {
      id: 'lastName',
      title: 'Last Name',
      type: 'short-input',
      placeholder: 'Last name',
      condition: { field: 'operation', value: ['find_phone', 'find_email'] },
    },
    {
      id: 'company',
      title: 'Company',
      type: 'short-input',
      placeholder: 'Company name',
      condition: { field: 'operation', value: ['find_phone', 'find_email'] },
    },
    {
      id: 'linkedinUrl',
      title: 'LinkedIn URL',
      type: 'short-input',
      placeholder: 'https://linkedin.com/in/...',
      condition: { field: 'operation', value: ['find_phone', 'find_email'] },
    },
    {
      id: 'emailInput',
      title: 'Email',
      type: 'short-input',
      placeholder: 'Known email address',
      condition: { field: 'operation', value: 'find_email' },
      mode: 'advanced',
    },
    {
      id: 'phone',
      title: 'Phone',
      type: 'short-input',
      placeholder: 'Known phone number',
      condition: { field: 'operation', value: 'find_email' },
      mode: 'advanced',
    },
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      placeholder: 'Job title',
      condition: { field: 'operation', value: 'find_email' },
      mode: 'advanced',
    },
    {
      id: 'mode',
      title: 'Email Mode',
      type: 'dropdown',
      options: [
        { label: 'Professional', id: 'professional' },
        { label: 'Personal', id: 'personal' },
      ],
      condition: { field: 'operation', value: 'find_email' },
    },
    {
      id: 'leadInfo',
      title: 'Lead Info',
      type: 'long-input',
      placeholder: 'JSON object or text with lead details',
      required: true,
      condition: { field: 'operation', value: 'enrich_lead' },
    },
    {
      id: 'leadStruct',
      title: 'Lead Output Structure',
      type: 'long-input',
      placeholder: 'JSON object defining desired output fields',
      required: true,
      condition: { field: 'operation', value: 'enrich_lead' },
    },
    {
      id: 'leadResearchPlan',
      title: 'Research Plan',
      type: 'long-input',
      placeholder: 'Optional research instructions',
      condition: { field: 'operation', value: 'enrich_lead' },
      mode: 'advanced',
    },
    {
      id: 'targetCompany',
      title: 'Target Company',
      type: 'short-input',
      placeholder: 'Company name or domain',
      required: true,
      condition: { field: 'operation', value: 'enrich_company' },
    },
    {
      id: 'companyStruct',
      title: 'Company Output Structure',
      type: 'long-input',
      placeholder: 'JSON object defining desired output fields',
      required: true,
      condition: { field: 'operation', value: 'enrich_company' },
    },
    {
      id: 'findPeople',
      title: 'Find People',
      type: 'switch',
      condition: { field: 'operation', value: 'enrich_company' },
    },
    {
      id: 'peopleFocusPrompt',
      title: 'People Focus',
      type: 'long-input',
      placeholder: 'e.g. Focus on engineering leaders',
      condition: { field: 'operation', value: 'enrich_company' },
      mode: 'advanced',
    },
    {
      id: 'fullOrgChart',
      title: 'Full Org Chart',
      type: 'switch',
      condition: { field: 'operation', value: 'enrich_company' },
      mode: 'advanced',
    },
    {
      id: 'companyLeadStruct',
      title: 'People Output Structure',
      type: 'long-input',
      placeholder: 'JSON object defining people fields',
      condition: { field: 'operation', value: 'enrich_company' },
      mode: 'advanced',
    },
    {
      id: 'companyResearchPlan',
      title: 'Research Plan',
      type: 'long-input',
      placeholder: 'Optional research instructions',
      condition: { field: 'operation', value: 'enrich_company' },
      mode: 'advanced',
    },
  ],
  tools: {
    access: [
      'sixtyfour_find_phone',
      'sixtyfour_find_email',
      'sixtyfour_enrich_lead',
      'sixtyfour_enrich_company',
    ],
    config: {
      tool: (params) => `sixtyfour_${params.operation}`,
      params: (params) => {
        const result: Record<string, unknown> = {}
        const op = params.operation

        if (op === 'find_phone' || op === 'find_email') {
          if (params.firstName) result.firstName = params.firstName
          if (params.lastName) result.lastName = params.lastName
          if (params.company) result.company = params.company
          if (params.linkedinUrl) result.linkedinUrl = params.linkedinUrl
          if (op === 'find_email') {
            if (params.emailInput) result.email = params.emailInput
            if (params.phone) result.phone = params.phone
            if (params.title) result.title = params.title
            if (params.mode) result.mode = params.mode
          }
        } else if (op === 'enrich_lead') {
          if (params.leadInfo) result.leadInfo = params.leadInfo
          if (params.leadStruct) result.leadStruct = params.leadStruct
          if (params.leadResearchPlan) result.researchPlan = params.leadResearchPlan
        } else if (op === 'enrich_company') {
          if (params.targetCompany) result.company = params.targetCompany
          if (params.companyStruct) result.companyStruct = params.companyStruct
          if (params.findPeople != null) result.findPeople = params.findPeople
          if (params.peopleFocusPrompt) result.peopleFocusPrompt = params.peopleFocusPrompt
          if (params.fullOrgChart != null) result.fullOrgChart = params.fullOrgChart
          if (params.companyLeadStruct) result.leadStruct = params.companyLeadStruct
          if (params.companyResearchPlan) result.researchPlan = params.companyResearchPlan
        }

        return result
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: '64 API key' },
    firstName: { type: 'string', description: 'First name' },
    lastName: { type: 'string', description: 'Last name' },
    company: { type: 'string', description: 'Company name' },
    linkedinUrl: { type: 'string', description: 'LinkedIn profile URL' },
    emailInput: { type: 'string', description: 'Known email address' },
    phone: { type: 'string', description: 'Known phone number' },
    title: { type: 'string', description: 'Job title' },
    mode: { type: 'string', description: 'Email type (professional or personal)' },
    leadInfo: { type: 'string', description: 'Lead information for enrichment' },
    leadStruct: { type: 'string', description: 'Lead output structure definition' },
    leadResearchPlan: { type: 'string', description: 'Lead research instructions' },
    targetCompany: { type: 'string', description: 'Company name or domain' },
    companyStruct: { type: 'string', description: 'Company output structure definition' },
    findPeople: { type: 'boolean', description: 'Whether to find associated people' },
    peopleFocusPrompt: { type: 'string', description: 'Focus instructions for people search' },
    fullOrgChart: { type: 'boolean', description: 'Whether to build full org chart' },
    companyLeadStruct: { type: 'string', description: 'People output structure definition' },
    companyResearchPlan: { type: 'string', description: 'Company research instructions' },
  },
  outputs: {
    result: { type: 'json', description: 'Enrichment or lookup result' },
    phone: { type: 'string', description: 'Found phone number' },
    email: { type: 'string', description: 'Found email address' },
    data: { type: 'json', description: 'Enriched lead or company data' },
  },
}
