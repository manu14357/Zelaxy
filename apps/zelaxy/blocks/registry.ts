/**
 * Blocks Registry
 *
 */

import { A2ABlock } from '@/blocks/blocks/a2a'
import { AgentBlock } from '@/blocks/blocks/agent'
import { AgentMailBlock } from '@/blocks/blocks/agentmail'
import { AgentPhoneBlock } from '@/blocks/blocks/agentphone'
import { AgiloftBlock } from '@/blocks/blocks/agiloft'
import { AhrefsBlock } from '@/blocks/blocks/ahrefs'
import { AirtableBlock } from '@/blocks/blocks/airtable'
import { AirweaveBlock } from '@/blocks/blocks/airweave'
import { AlgoliaBlock } from '@/blocks/blocks/algolia'
import { AmplitudeBlock } from '@/blocks/blocks/amplitude'
import { ApiBlock } from '@/blocks/blocks/api'
import { ApiTriggerBlock } from '@/blocks/blocks/api_trigger'
import { ApifyBlock } from '@/blocks/blocks/apify'
import { ApolloBlock } from '@/blocks/blocks/apollo'
import { ArxivBlock } from '@/blocks/blocks/arxiv'
import { AsanaBlock } from '@/blocks/blocks/asana'
import { AshbyBlock } from '@/blocks/blocks/ashby'
import { AthenaBlock } from '@/blocks/blocks/athena'
import { AttioBlock } from '@/blocks/blocks/attio'
import { AzureDevOpsBlock } from '@/blocks/blocks/azure_devops'
import { BoxBlock } from '@/blocks/blocks/box'
import { BrandfetchBlock } from '@/blocks/blocks/brandfetch'
import { BrightDataBlock } from '@/blocks/blocks/brightdata'
import { BrowserUseBlock } from '@/blocks/blocks/browser_use'
import { CalcomBlock } from '@/blocks/blocks/calcom'
import { CalendlyBlock } from '@/blocks/blocks/calendly'
import { ChatTriggerBlock } from '@/blocks/blocks/chat_trigger'
import { CirclebackBlock } from '@/blocks/blocks/circleback'
import { ClayBlock } from '@/blocks/blocks/clay'
import { ClerkBlock } from '@/blocks/blocks/clerk'
import { CloudflareBlock } from '@/blocks/blocks/cloudflare'
import { CloudFormationBlock } from '@/blocks/blocks/cloudformation'
import { CloudWatchBlock } from '@/blocks/blocks/cloudwatch'
import { ConditionBlock } from '@/blocks/blocks/condition'
import { ConfluenceBlock } from '@/blocks/blocks/confluence'
import { CredentialBlock } from '@/blocks/blocks/credential'
import { CrowdStrikeBlock } from '@/blocks/blocks/crowdstrike'
import { CursorBlock } from '@/blocks/blocks/cursor'
import { DagsterBlock } from '@/blocks/blocks/dagster'
import { DatabricksBlock } from '@/blocks/blocks/databricks'
import { DatadogBlock } from '@/blocks/blocks/datadog'
import { DelayBlock } from '@/blocks/blocks/delay'
import { DevinBlock } from '@/blocks/blocks/devin'
import { DiscordBlock } from '@/blocks/blocks/discord'
import { DocusignBlock } from '@/blocks/blocks/docusign'
import { DropboxBlock } from '@/blocks/blocks/dropbox'
import { DSPyBlock } from '@/blocks/blocks/dspy'
import { DubBlock } from '@/blocks/blocks/dub'
import { DuckDuckGoBlock } from '@/blocks/blocks/duckduckgo'
import { DynamoDBBlock } from '@/blocks/blocks/dynamodb'
import { ElasticsearchBlock } from '@/blocks/blocks/elasticsearch'
import { ElevenLabsBlock } from '@/blocks/blocks/elevenlabs'
import { EmailBisonBlock } from '@/blocks/blocks/emailbison'
import { EnrichBlock } from '@/blocks/blocks/enrich'
import { EvaluatorBlock } from '@/blocks/blocks/evaluator'
import { EvernoteBlock } from '@/blocks/blocks/evernote'
import { ExaBlock } from '@/blocks/blocks/exa'
import { FathomBlock } from '@/blocks/blocks/fathom'
import { FileBlock } from '@/blocks/blocks/file'
import { FirecrawlBlock } from '@/blocks/blocks/firecrawl'
import { FunctionBlock } from '@/blocks/blocks/function'
import { GenericWebhookBlock } from '@/blocks/blocks/generic_webhook'
import { GitHubBlock } from '@/blocks/blocks/github'
import { GmailBlock } from '@/blocks/blocks/gmail'
import { GoogleSearchBlock } from '@/blocks/blocks/google'
import { GoogleCalendarBlock } from '@/blocks/blocks/google_calendar'
import { GoogleDocsBlock } from '@/blocks/blocks/google_docs'
import { GoogleDriveBlock } from '@/blocks/blocks/google_drive'
import { GoogleSheetsBlock } from '@/blocks/blocks/google_sheets'
import { GuardrailsBlock } from '@/blocks/blocks/guardrails'
import { HuggingFaceBlock } from '@/blocks/blocks/huggingface'
import { HumanInTheLoopBlock } from '@/blocks/blocks/human_in_the_loop'
import { HunterBlock } from '@/blocks/blocks/hunter'
import { ImageGeneratorBlock } from '@/blocks/blocks/image_generator'
import { ImageSearchBlock } from '@/blocks/blocks/image_search'
import { JinaBlock } from '@/blocks/blocks/jina'
import { JiraBlock } from '@/blocks/blocks/jira'
import { KnowledgeBlock } from '@/blocks/blocks/knowledge'
import { LinearBlock } from '@/blocks/blocks/linear'
import { LinkedInBlock } from '@/blocks/blocks/linkedin'
import { LinkupBlock } from '@/blocks/blocks/linkup'
import { LoopBlock } from '@/blocks/blocks/loop'
import { MCPBlock } from '@/blocks/blocks/mcp'
import { Mem0Block } from '@/blocks/blocks/mem0'
import { MemoryBlock } from '@/blocks/blocks/memory'
import { MicrosoftExcelBlock } from '@/blocks/blocks/microsoft_excel'
import { MicrosoftPlannerBlock } from '@/blocks/blocks/microsoft_planner'
import { MicrosoftTeamsBlock } from '@/blocks/blocks/microsoft_teams'
import { MistralParseBlock } from '@/blocks/blocks/mistral_parse'
import { MSSQLBlock } from '@/blocks/blocks/mssql'
import { MySQLBlock } from '@/blocks/blocks/mysql'
import { NoteBlock } from '@/blocks/blocks/note'
import { NotionBlock } from '@/blocks/blocks/notion'
import { OneDriveBlock } from '@/blocks/blocks/onedrive'
import { OpenAIBlock } from '@/blocks/blocks/openai'
import { OutlookBlock } from '@/blocks/blocks/outlook'
import { ParallelBlock } from '@/blocks/blocks/parallel'
import { PerplexityBlock } from '@/blocks/blocks/perplexity'
import { PineconeBlock } from '@/blocks/blocks/pinecone'
import { PostgreSQLBlock } from '@/blocks/blocks/postgresql'
import { QdrantBlock } from '@/blocks/blocks/qdrant'
import { RedditBlock } from '@/blocks/blocks/reddit'
import { ResendBlock } from '@/blocks/blocks/resend'
import { ResponseBlock } from '@/blocks/blocks/response'
import { RouterBlock } from '@/blocks/blocks/router'
import { S3Block } from '@/blocks/blocks/s3'
import { ScheduleBlock } from '@/blocks/blocks/schedule'
import { SerperBlock } from '@/blocks/blocks/serper'
import { SharepointBlock } from '@/blocks/blocks/sharepoint'
import { SlackBlock } from '@/blocks/blocks/slack'
import { SMTPBlock } from '@/blocks/blocks/smtp'
import { SnowflakeBlock } from '@/blocks/blocks/snowflake'
import { StagehandBlock } from '@/blocks/blocks/stagehand'
import { StagehandAgentBlock } from '@/blocks/blocks/stagehand_agent'
import { StarterBlock } from '@/blocks/blocks/starter'
import { SupabaseBlock } from '@/blocks/blocks/supabase'
import { SwitchBlock } from '@/blocks/blocks/switch'
import { TableBlock } from '@/blocks/blocks/table'
import { TavilyBlock } from '@/blocks/blocks/tavily'
import { TelegramBlock } from '@/blocks/blocks/telegram'
import { ThinkingBlock } from '@/blocks/blocks/thinking'
import { TranslateBlock } from '@/blocks/blocks/translate'
import { TwilioSMSBlock } from '@/blocks/blocks/twilio'
import { TypeformBlock } from '@/blocks/blocks/typeform'
import { VariablesBlock } from '@/blocks/blocks/variables'
import { VisionBlock } from '@/blocks/blocks/vision'
import { WaitBlock } from '@/blocks/blocks/wait'
import { WealthboxBlock } from '@/blocks/blocks/wealthbox'
import { WebhookBlock } from '@/blocks/blocks/webhook'
import { WhatsAppBlock } from '@/blocks/blocks/whatsapp'
import { WikipediaBlock } from '@/blocks/blocks/wikipedia'
import { WorkflowBlock } from '@/blocks/blocks/workflow'
import { XBlock } from '@/blocks/blocks/x'
import { YouTubeBlock } from '@/blocks/blocks/youtube'
import { ZelaxyArenaBlock } from '@/blocks/blocks/zelaxy_arena'
import { GammaBlock } from '@/blocks/blocks/gamma'
import { GrainBlock } from '@/blocks/blocks/grain'
import { GranolaBlock } from '@/blocks/blocks/granola'
import { HexBlock } from '@/blocks/blocks/hex'
import { InputTriggerBlock } from '@/blocks/blocks/input_trigger'
import { KalshiBlock } from '@/blocks/blocks/kalshi'
import { LogsBlock } from '@/blocks/blocks/logs'
import { LumaBlock } from '@/blocks/blocks/luma'
import { ManualTriggerBlock } from '@/blocks/blocks/manual_trigger'
import { PolymarketBlock } from '@/blocks/blocks/polymarket'
import { ProfoundBlock } from '@/blocks/blocks/profound'
import { PulseBlock } from '@/blocks/blocks/pulse'
import { QuiverBlock } from '@/blocks/blocks/quiver'
import { SearchBlock } from '@/blocks/blocks/search'
import { SixtyfourBlock } from '@/blocks/blocks/sixtyfour'
import { StartTriggerBlock } from '@/blocks/blocks/start_trigger'
import { VideoGeneratorBlock } from '@/blocks/blocks/video_generator'
import { WorkflowInputBlock } from '@/blocks/blocks/workflow_input'
import type { BlockConfig } from '@/blocks/types'

// Registry of all available blocks, alphabetically sorted
export const registry: Record<string, BlockConfig> = {
  agent: AgentBlock,
  airtable: AirtableBlock,
  api: ApiBlock,
  arxiv: ArxivBlock,
  browser_use: BrowserUseBlock,
  clay: ClayBlock,
  condition: ConditionBlock,
  confluence: ConfluenceBlock,
  delay: DelayBlock,
  discord: DiscordBlock,
  elevenlabs: ElevenLabsBlock,
  evaluator: EvaluatorBlock,
  exa: ExaBlock,
  firecrawl: FirecrawlBlock,
  file: FileBlock,
  function: FunctionBlock,
  generic_webhook: GenericWebhookBlock,
  github: GitHubBlock,
  gmail: GmailBlock,
  google_calendar: GoogleCalendarBlock,
  google_docs: GoogleDocsBlock,
  google_drive: GoogleDriveBlock,
  google_search: GoogleSearchBlock,
  google_sheets: GoogleSheetsBlock,
  guardrails: GuardrailsBlock,
  huggingface: HuggingFaceBlock,
  hunter: HunterBlock,
  image_generator: ImageGeneratorBlock,
  image_search: ImageSearchBlock,
  jina: JinaBlock,
  jira: JiraBlock,
  knowledge: KnowledgeBlock,
  linear: LinearBlock,
  linkedin: LinkedInBlock,
  linkup: LinkupBlock,
  loop: LoopBlock,
  mem0: Mem0Block,
  microsoft_excel: MicrosoftExcelBlock,
  microsoft_planner: MicrosoftPlannerBlock,
  microsoft_teams: MicrosoftTeamsBlock,
  mistral_parse: MistralParseBlock,
  mcp: MCPBlock,
  mssql: MSSQLBlock,
  mysql: MySQLBlock,
  notion: NotionBlock,
  openai: OpenAIBlock,
  outlook: OutlookBlock,
  onedrive: OneDriveBlock,
  parallel: ParallelBlock,
  perplexity: PerplexityBlock,
  pinecone: PineconeBlock,
  postgresql: PostgreSQLBlock,
  qdrant: QdrantBlock,
  memory: MemoryBlock,
  reddit: RedditBlock,
  resend: ResendBlock,
  response: ResponseBlock,
  router: RouterBlock,
  schedule: ScheduleBlock,
  s3: S3Block,
  serper: SerperBlock,
  sharepoint: SharepointBlock,
  stagehand: StagehandBlock,
  stagehand_agent: StagehandAgentBlock,
  slack: SlackBlock,
  smtp: SMTPBlock,
  snowflake: SnowflakeBlock,
  starter: StarterBlock,
  supabase: SupabaseBlock,
  switch: SwitchBlock,
  table: TableBlock,
  tavily: TavilyBlock,
  telegram: TelegramBlock,
  thinking: ThinkingBlock,
  translate: TranslateBlock,
  twilio_sms: TwilioSMSBlock,
  typeform: TypeformBlock,
  credential: CredentialBlock,
  human_in_the_loop: HumanInTheLoopBlock,
  note: NoteBlock,
  variables: VariablesBlock,
  wait: WaitBlock,
  zelaxy_arena: ZelaxyArenaBlock,
  vision: VisionBlock,
  wealthbox: WealthboxBlock,
  webhook: WebhookBlock,
  whatsapp: WhatsAppBlock,
  wikipedia: WikipediaBlock,
  workflow: WorkflowBlock,
  x: XBlock,
  youtube: YouTubeBlock,
  a2a: A2ABlock,
  agentmail: AgentMailBlock,
  agentphone: AgentPhoneBlock,
  agiloft: AgiloftBlock,
  ahrefs: AhrefsBlock,
  airweave: AirweaveBlock,
  algolia: AlgoliaBlock,
  amplitude: AmplitudeBlock,
  api_trigger: ApiTriggerBlock,
  apify: ApifyBlock,
  apollo: ApolloBlock,
  asana: AsanaBlock,
  ashby: AshbyBlock,
  athena: AthenaBlock,
  attio: AttioBlock,
  azure_devops: AzureDevOpsBlock,
  box: BoxBlock,
  brandfetch: BrandfetchBlock,
  brightdata: BrightDataBlock,
  calcom: CalcomBlock,
  calendly: CalendlyBlock,
  chat_trigger: ChatTriggerBlock,
  circleback: CirclebackBlock,
  clerk: ClerkBlock,
  cloudflare: CloudflareBlock,
  cloudformation: CloudFormationBlock,
  cloudwatch: CloudWatchBlock,
  crowdstrike: CrowdStrikeBlock,
  cursor: CursorBlock,
  dagster: DagsterBlock,
  databricks: DatabricksBlock,
  datadog: DatadogBlock,
  devin: DevinBlock,
  docusign: DocusignBlock,
  dropbox: DropboxBlock,
  dspy: DSPyBlock,
  dub: DubBlock,
  duckduckgo: DuckDuckGoBlock,
  dynamodb: DynamoDBBlock,
  elasticsearch: ElasticsearchBlock,
  emailbison: EmailBisonBlock,
  enrich: EnrichBlock,
  evernote: EvernoteBlock,
  fathom: FathomBlock,
  gamma: GammaBlock,
  grain: GrainBlock,
  granola: GranolaBlock,
  hex: HexBlock,
  input_trigger: InputTriggerBlock,
  kalshi: KalshiBlock,
  logs: LogsBlock,
  luma: LumaBlock,
  manual_trigger: ManualTriggerBlock,
  polymarket: PolymarketBlock,
  profound: ProfoundBlock,
  pulse: PulseBlock,
  quiver: QuiverBlock,
  search: SearchBlock,
  sixtyfour: SixtyfourBlock,
  start_trigger: StartTriggerBlock,
  video_generator: VideoGeneratorBlock,
  workflow_input: WorkflowInputBlock,
}

export const getBlock = (type: string): BlockConfig | undefined => registry[type]

export const getBlocksByCategory = (category: 'blocks' | 'tools' | 'triggers'): BlockConfig[] =>
  Object.values(registry).filter((block) => block.category === category)

export const getAllBlockTypes = (): string[] => Object.keys(registry)

export const isValidBlockType = (type: string): type is string => type in registry

export const getAllBlocks = (): BlockConfig[] => Object.values(registry)
