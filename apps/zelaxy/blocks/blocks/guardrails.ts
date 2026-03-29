import { ShieldCheckIcon } from '@/components/icons'
import { isHosted } from '@/lib/environment'
import type { BlockConfig } from '@/blocks/types'
import {
  getBaseModelProviders,
  getHostedModels,
  getProviderIcon,
  providers,
} from '@/providers/utils'
import { useOllamaStore } from '@/stores/ollama/store'
import type { ToolResponse } from '@/tools/types'

// Define GuardrailsResponse interface locally to avoid import issues
export interface GuardrailsResponse extends ToolResponse {
  output: {
    passed: boolean
    validationType: string
    input: string
    score?: number
    reasoning?: string
    detectedEntities?: Array<{
      type: string
      start: number
      end: number
      score: number
      text: string
    }>
    maskedText?: string
    error?: string
  }
}

// Get current Ollama models dynamically
const getCurrentOllamaModels = () => {
  return useOllamaStore.getState().models
}

export const GuardrailsBlock: BlockConfig<GuardrailsResponse> = {
  type: 'guardrails',
  name: 'Guardrails',
  description: 'Validate content with guardrails',
  longDescription:
    'Validate content using guardrails. Check if content is valid JSON, matches a regex pattern, detect hallucinations using RAG + LLM scoring, or detect PII.',
  category: 'blocks',
  docsLink: 'https://docs.zelaxy.ai/blocks/guardrails',
  bgColor: '#3D642D',
  icon: ShieldCheckIcon,
  subBlocks: [
    {
      id: 'input',
      title: 'Content to Validate',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter content to validate or use {{blockName.output.fieldName}}',
      required: true,
      description: 'Text content to validate through guardrails',
      wandConfig: {
        enabled: true,
        prompt: `# ROLE
You are an AI assistant that generates sample content for testing guardrails validation systems.

# TASK
Generate raw content based on user requirements that will be directly validated by a guardrails system.

# OUTPUT FORMAT
- Generate ONLY the raw content itself
- NO explanations, introductions, or commentary
- NO markdown formatting or code blocks
- NO phrases like "Here is..." or "Below is..."
- Output must be ready for immediate validation

# CONTENT TYPES

## 1. JSON Content
Generate valid or intentionally invalid JSON objects/arrays:
- User profiles: {"name": "John Doe", "age": 30, "email": "john@example.com"}
- API responses: {"status": "success", "data": [...], "timestamp": "2025-01-15"}
- Configuration files: {"theme": "dark", "language": "en", "notifications": true}
- Include nested objects, arrays, and edge cases as needed

## 2. PII-Containing Content
Generate plain text with fictional personal information:
- Basic: "My name is Raj Sharma, email raj.sharma@example.com, phone +91-9876543210"
- Detailed: "Contact Priya Patel at priya.patel@company.in or call +91-8765432109. Her Aadhaar is 1234-5678-9012."
- Include: names, emails, phone numbers, addresses, Aadhaar, PAN cards
- Always use FICTIONAL data only

## 3. Pattern-Based Content
Generate raw text/data that should match specific patterns:
- Email: user@domain.com
- Phone: +1-555-123-4567
- URL: https://example.com/path
- Date: 2025-01-15
- Custom formats as requested

## 4. General Text Content
Generate contextually appropriate plain text for validation testing.

# RULES
✓ Output ONLY the raw content
✓ Make content realistic and testable
✓ Include edge cases when appropriate
✓ Use fictional data for PII

✗ NO explanations or descriptions
✗ NO markdown or formatting
✗ NO code block wrappers
✗ NO introductory text

Context: {context}

Generate the raw content now:`,
        placeholder: 'Describe the type of content you want to test with guardrails...',
        generationType: 'custom-tool-schema',
      },
    },
    {
      id: 'validationType',
      title: 'Validation Type',
      type: 'dropdown',
      layout: 'full',
      required: true,
      options: [
        { label: 'Valid JSON', id: 'json' },
        { label: 'Regex Match', id: 'regex' },
        { label: 'Hallucination Check', id: 'hallucination' },
        { label: 'PII Detection', id: 'pii' },
      ],
      value: () => 'json',
      description: 'Choose the type of validation to perform',
      wandConfig: {
        enabled: true,
        prompt: `# ROLE
You are an AI assistant that selects the appropriate validation type for guardrails.

# TASK
Based on user requirements, respond with ONLY the validation type ID.

# VALIDATION TYPES

## json - JSON Validation
**Purpose:** Verify content is valid JSON format
**Use Cases:**
- API response validation
- Configuration file checking
- Structured data verification
**When to use:** User needs to validate JSON syntax and structure

## regex - Regex Pattern Matching
**Purpose:** Check if content matches a specific pattern
**Use Cases:**
- Email format validation
- Phone number verification
- URL format checking
- Custom format validation
**When to use:** User needs to validate against a specific pattern or format

## hallucination - Hallucination Detection
**Purpose:** Detect AI-generated content that contradicts known facts
**Use Cases:**
- Fact-checking AI outputs
- Content accuracy verification
- Knowledge base validation
**Requirements:** Knowledge base + AI model
**When to use:** User needs to verify content accuracy against trusted sources

## pii - PII Detection
**Purpose:** Identify personally identifiable information
**Use Cases:**
- Privacy compliance (GDPR, CCPA, Indian IT Act)
- Data scrubbing before storage/sharing
- Sensitive information detection
**When to use:** User needs to detect/protect personal information

# DECISION LOGIC
- Need to validate JSON structure? → json
- Need to match a format/pattern? → regex
- Need to check factual accuracy? → hallucination
- Need to detect personal information? → pii

# OUTPUT FORMAT
Respond with ONLY one of: json, regex, hallucination, pii

Context: {context}

Validation type:`,
        placeholder: 'Describe what you want to validate and why...',
        generationType: 'custom-tool-schema',
      },
    },
    {
      id: 'regex',
      title: 'Regex Pattern',
      type: 'long-input',
      layout: 'full',
      placeholder: '^\\{.*\\}$',
      required: true,
      condition: {
        field: 'validationType',
        value: 'regex',
      },
      description:
        'Regular expression pattern to match against. Examples: ^\\{.*\\}$ (any JSON), ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$ (email)',
      wandConfig: {
        enabled: true,
        prompt: `# ROLE
You are a regex pattern generator that creates syntactically correct regular expressions.

# TASK
Generate a valid, complete regex pattern based on user requirements.

# OUTPUT FORMAT
- Output ONLY the regex pattern
- NO explanations or descriptions
- NO code blocks or quotes
- NO markdown formatting
- Pattern must be syntactically valid and complete

# COMMON PATTERNS

## Data Formats
- Email: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$
- Phone (international): ^\\+?[1-9]\\d{1,14}$
- URL: ^https?://[^\\s]+$
- Date YYYY-MM-DD: ^\\d{4}-\\d{2}-\\d{2}$

## Structured Data
- Any JSON object: ^\\{.*\\}$
- Simple text: ^[a-zA-Z0-9\\s]+$
- Alphanumeric with hyphens: ^[a-zA-Z0-9-]+$

## Indian Formats
- Phone: ^[6-9]\\d{9}$
- PIN code: ^[1-9]\\d{5}$
- PAN: ^[A-Z]{5}\\d{4}[A-Z]$

# VALIDATION CHECKLIST
Before outputting, verify:
✓ Pattern has proper start/end anchors (^ and $) if needed
✓ All character classes [ ] are properly closed
✓ All escape sequences are complete (use \\\\ for literal backslash)
✓ Pattern would compile in JavaScript
✓ Pattern is as simple as possible while meeting requirements

# IMPORTANT NOTES
- For JSON validation, prefer the "Valid JSON" validation type
- Keep patterns simple and maintainable
- Use non-capturing groups (?:...) when grouping without capture
- Test mentally if pattern would match intended strings

Context: {context}

Pattern:`,
        generationType: 'custom-tool-schema',
        placeholder: 'Describe the format you want to validate...',
      },
    },
    {
      id: 'knowledgeBaseId',
      title: 'Knowledge Base',
      type: 'knowledge-base-selector',
      layout: 'full',
      placeholder: 'Select knowledge base for context',
      multiSelect: false,
      required: true,
      condition: {
        field: 'validationType',
        value: 'hallucination',
      },
      description: 'Knowledge base to use for hallucination detection',
    },
    {
      id: 'model',
      title: 'AI Model',
      type: 'combobox',
      layout: 'half',
      placeholder: 'Select or type a model name...',
      required: true,
      options: () => {
        const ollamaModels = useOllamaStore.getState().models
        const baseModels = Object.keys(getBaseModelProviders())
        const allModels = [...baseModels, ...ollamaModels]

        return allModels.map((model) => {
          const icon = getProviderIcon(model)
          return {
            label: model,
            id: model,
            ...(icon && { icon }),
          }
        })
      },
      condition: {
        field: 'validationType',
        value: 'hallucination',
      },
      value: () => 'gpt-4o-mini',
      description: 'LLM model for confidence scoring',
    },
    {
      id: 'threshold',
      title: 'Confidence Threshold',
      type: 'slider',
      layout: 'half',
      min: 0,
      max: 10,
      step: 1,
      value: () => '3',
      condition: {
        field: 'validationType',
        value: 'hallucination',
      },
      description: 'Minimum confidence score to pass (0-10, scores below this fail)',
    },
    {
      id: 'topK',
      title: 'Number of Context Chunks',
      type: 'slider',
      layout: 'full',
      min: 1,
      max: 20,
      step: 1,
      value: () => '5',
      mode: 'advanced',
      condition: {
        field: 'validationType',
        value: 'hallucination',
      },
      description: 'Number of knowledge base chunks to retrieve for context',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your API key',
      password: true,
      required: true,
      condition: () => {
        const baseCondition = {
          field: 'validationType' as const,
          value: ['hallucination'],
        }

        if (isHosted) {
          return {
            ...baseCondition,
            and: {
              field: 'model' as const,
              value: getHostedModels(),
              not: true,
            },
          }
        }

        return {
          ...baseCondition,
          and: {
            field: 'model' as const,
            value: getCurrentOllamaModels(),
            not: true,
          },
        }
      },
      description: 'API key for the selected model provider',
    },
    {
      id: 'azureEndpoint',
      title: 'Azure OpenAI Endpoint',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'https://your-resource.openai.azure.com',
      connectionDroppable: false,
      condition: {
        field: 'validationType',
        value: 'hallucination',
        and: {
          field: 'model',
          value: providers['azure-openai'].models,
        },
      },
    },
    {
      id: 'azureApiVersion',
      title: 'Azure API Version',
      type: 'short-input',
      layout: 'full',
      placeholder: '2024-07-01-preview',
      connectionDroppable: false,
      condition: {
        field: 'validationType',
        value: 'hallucination',
        and: {
          field: 'model',
          value: providers['azure-openai'].models,
        },
      },
    },
    {
      id: 'piiEntityTypes',
      title: 'PII Types to Detect',
      type: 'checkbox-list',
      layout: 'full',
      multiSelect: true,
      options: [
        // Common PII types
        { label: 'Person name', id: 'PERSON' },
        { label: 'Email address', id: 'EMAIL_ADDRESS' },
        { label: 'Phone number', id: 'PHONE_NUMBER' },
        { label: 'Location', id: 'LOCATION' },
        { label: 'Date or time', id: 'DATE_TIME' },
        { label: 'IP address', id: 'IP_ADDRESS' },
        { label: 'URL', id: 'URL' },
        { label: 'Credit card number', id: 'CREDIT_CARD' },
        { label: 'International bank account number (IBAN)', id: 'IBAN_CODE' },
        { label: 'Cryptocurrency wallet address', id: 'CRYPTO' },
        { label: 'Medical license number', id: 'MEDICAL_LICENSE' },
        { label: 'Nationality / religion / political group', id: 'NRP' },
        // India
        { label: 'Indian Aadhaar', id: 'IN_AADHAAR' },
        { label: 'Indian PAN', id: 'IN_PAN' },
        { label: 'Indian vehicle registration', id: 'IN_VEHICLE_REGISTRATION' },
        { label: 'Indian voter number', id: 'IN_VOTER' },
        { label: 'Indian passport', id: 'IN_PASSPORT' },
        { label: 'Indian bank account number', id: 'IN_BANK_ACCOUNT' },
        { label: 'Indian driving license', id: 'IN_DRIVER_LICENSE' },
        { label: 'Indian GST number', id: 'IN_GST' },
      ],
      condition: {
        field: 'validationType',
        value: 'pii',
      },
      description: 'Select PII types to detect (leave empty to detect all types)',
    },
    {
      id: 'customPiiPatterns',
      title: 'Custom PII Patterns',
      type: 'long-input',
      layout: 'full',
      mode: 'advanced',
      placeholder:
        '{\n  "EMPLOYEE_ID": "EMP\\\\d{6}",\n  "AADHAR_CARD": "\\\\d{4}[-\\\\s]\\\\d{4}[-\\\\s]\\\\d{4}"\n}',
      condition: {
        field: 'validationType',
        value: 'pii',
      },
      description:
        'Define custom PII patterns as JSON: {"TYPE_NAME": "regex_pattern"}. Patterns will match within text. Do NOT use ^ or $ anchors. Use double backslashes for escaping.',
      wandConfig: {
        enabled: true,
        prompt: `# ROLE
You are a regex pattern generator for PII detection systems.

# TASK
Generate a JSON object containing custom PII regex patterns based on user requirements.

# OUTPUT FORMAT
- Output ONLY a valid JSON object
- NO explanations or descriptions
- NO markdown or code blocks
- NO introductory text

# PATTERN RULES

## Critical Requirements
✗ DO NOT use ^ (start anchor) or $ (end anchor)
✗ Patterns must match WITHIN larger text, not entire strings
✓ Use double backslashes (\\\\) for regex escaping in JSON
✓ Use [-\\\\s] to match hyphens OR spaces in separators

## Regex Building Blocks
- \\\\d = any digit (0-9)
- [A-Z] = uppercase letter
- [a-z] = lowercase letter  
- [A-Za-z] = any letter
- [A-Za-z0-9] = alphanumeric
- [-\\\\s] = hyphen or space
- {n} = exactly n occurrences
- {n,m} = between n and m occurrences
- + = one or more
- * = zero or more
- ? = optional (zero or one)

# EXAMPLE PATTERNS

## Correct ✓
{
  "EMPLOYEE_ID": "EMP\\\\d{6}",
  "AADHAR_CARD": "\\\\d{4}[-\\\\s]\\\\d{4}[-\\\\s]\\\\d{4}",
  "CUSTOMER_ID": "CUST-[A-Z]{3}-\\\\d{4}",
  "LICENSE_PLATE": "[A-Z]{2}[-\\\\s]?\\\\d{2}[-\\\\s]?[A-Z]{2}[-\\\\s]?\\\\d{4}",
  "INVOICE_NUMBER": "INV-\\\\d{4}-\\\\d{6}",
  "PRODUCT_CODE": "PRD-[A-Z0-9]{8}",
  "TICKET_ID": "TKT[0-9]{8}",
  "ORDER_NUMBER": "ORD-[A-Z]{2}\\\\d{10}"
}

## Incorrect ✗
{
  "EMPLOYEE_ID": "^EMP\\\\d{6}$",  // Has anchors - won't match within text
  "AADHAR_CARD": "^\\\\d{4}\\\\s\\\\d{4}\\\\s\\\\d{4}$"  // Anchors + only spaces
}

# COMMON USE CASES

## Business IDs
- Employee: EMP\\\\d{6}
- Customer: CUST-[A-Z0-9]{8}
- Invoice: INV-\\\\d{4}-\\\\d{6}

## Government IDs (India)
- Aadhaar: \\\\d{4}[-\\\\s]\\\\d{4}[-\\\\s]\\\\d{4}
- PAN: [A-Z]{5}\\\\d{4}[A-Z]
- Vehicle: [A-Z]{2}[-\\\\s]?\\\\d{2}[-\\\\s]?[A-Z]{2}[-\\\\s]?\\\\d{4}

## Custom Formats
- License plates, serial numbers, account numbers, etc.

Context: {context}

JSON object:`,
        placeholder: 'Describe the custom PII patterns you need...',
        generationType: 'custom-tool-schema',
      },
    },
    {
      id: 'piiMode',
      title: 'PII Action',
      type: 'dropdown',
      layout: 'half',
      required: true,
      options: [
        { label: 'Block Request', id: 'block' },
        { label: 'Mask PII', id: 'mask' },
      ],
      value: () => 'block',
      condition: {
        field: 'validationType',
        value: 'pii',
      },
      description: 'Action to take when PII is detected',
    },
    {
      id: 'piiLanguage',
      title: 'Language',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'English', id: 'en' },
        { label: 'Spanish', id: 'es' },
        { label: 'Italian', id: 'it' },
        { label: 'Polish', id: 'pl' },
        { label: 'Finnish', id: 'fi' },
      ],
      value: () => 'en',
      condition: {
        field: 'validationType',
        value: 'pii',
      },
      description: 'Language for PII detection',
    },
  ],
  tools: {
    access: ['guardrails_validate'],
  },
  inputs: {
    input: {
      type: 'string',
      description: 'Content to validate',
    },
    validationType: {
      type: 'string',
      description: 'Type of validation to perform',
    },
    regex: {
      type: 'string',
      description: 'Regex pattern for validation',
    },
    knowledgeBaseId: {
      type: 'string',
      description: 'Knowledge base ID for hallucination check',
    },
    threshold: {
      type: 'number',
      description: 'Confidence threshold for hallucination check',
    },
    topK: {
      type: 'number',
      description: 'Number of context chunks to retrieve',
    },
    model: {
      type: 'string',
      description: 'LLM model for hallucination scoring',
    },
    apiKey: {
      type: 'string',
      description: 'API key for model provider',
    },
    azureEndpoint: {
      type: 'string',
      description: 'Azure OpenAI endpoint URL',
    },
    azureApiVersion: {
      type: 'string',
      description: 'Azure API version',
    },
    piiEntityTypes: {
      type: 'json',
      description: 'PII entity types to detect',
    },
    piiMode: {
      type: 'string',
      description: 'PII action mode',
    },
    piiLanguage: {
      type: 'string',
      description: 'Language for PII detection',
    },
    customPiiPatterns: {
      type: 'json',
      description: 'Custom PII patterns as JSON object',
    },
  },
  outputs: {
    passed: {
      type: 'boolean',
      description: 'Whether validation passed',
    },
    validationType: {
      type: 'string',
      description: 'Type of validation performed',
    },
    input: {
      type: 'string',
      description: 'Original input that was validated',
    },
    score: {
      type: 'number',
      description: 'Confidence score (0-10, only for hallucination check)',
    },
    reasoning: {
      type: 'string',
      description: 'Reasoning for confidence score',
    },
    detectedEntities: {
      type: 'json',
      description: 'Detected PII entities',
    },
    maskedText: {
      type: 'string',
      description: 'Text with PII masked',
    },
    error: {
      type: 'string',
      description: 'Error message if validation failed',
    },
  },
}
