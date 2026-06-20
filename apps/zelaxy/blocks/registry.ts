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
import { AppConfigBlock } from '@/blocks/blocks/appconfig'
import { ArxivBlock } from '@/blocks/blocks/arxiv'
import { AsanaBlock } from '@/blocks/blocks/asana'
import { AshbyBlock } from '@/blocks/blocks/ashby'
import { AthenaBlock } from '@/blocks/blocks/athena'
import { AttioBlock } from '@/blocks/blocks/attio'
import { AzureDevOpsBlock } from '@/blocks/blocks/azure_devops'
import { BoxBlock } from '@/blocks/blocks/box'
import { BrandfetchBlock } from '@/blocks/blocks/brandfetch'
// Phase 2 — Tiers D, G & H
import { BrexBlock } from '@/blocks/blocks/brex'
import { BrightDataBlock } from '@/blocks/blocks/brightdata'
import { BrowserUseBlock } from '@/blocks/blocks/browser_use'
import { CalcomBlock } from '@/blocks/blocks/calcom'
import { CalendlyBlock } from '@/blocks/blocks/calendly'
import { ChatTriggerBlock } from '@/blocks/blocks/chat_trigger'
import { CirclebackBlock } from '@/blocks/blocks/circleback'
import { ClayBlock } from '@/blocks/blocks/clay'
import { ClerkBlock } from '@/blocks/blocks/clerk'
// Phase 2 integrations
import { ClickhouseBlock } from '@/blocks/blocks/clickhouse'
import { CloudflareBlock } from '@/blocks/blocks/cloudflare'
import { CloudFormationBlock } from '@/blocks/blocks/cloudformation'
import { CloudWatchBlock } from '@/blocks/blocks/cloudwatch'
// Phase 2 — AWS (SigV4) + remaining HTTP/DB
import { CodepipelineBlock } from '@/blocks/blocks/codepipeline'
import { ConditionBlock } from '@/blocks/blocks/condition'
import { ConfluenceBlock } from '@/blocks/blocks/confluence'
// Phase 2 — Tiers E & F
import { ContextDevBlock } from '@/blocks/blocks/context_dev'
import { ConvexBlock } from '@/blocks/blocks/convex'
import { CredentialBlock } from '@/blocks/blocks/credential'
import { CrowdStrikeBlock } from '@/blocks/blocks/crowdstrike'
import { CursorBlock } from '@/blocks/blocks/cursor'
import { DagsterBlock } from '@/blocks/blocks/dagster'
import { DatabricksBlock } from '@/blocks/blocks/databricks'
import { DatadogBlock } from '@/blocks/blocks/datadog'
import { DatagmaBlock } from '@/blocks/blocks/datagma'
import { DaytonaBlock } from '@/blocks/blocks/daytona'
import { DelayBlock } from '@/blocks/blocks/delay'
import { DevinBlock } from '@/blocks/blocks/devin'
import { DiscordBlock } from '@/blocks/blocks/discord'
import { DocumentGeneratorBlock } from '@/blocks/blocks/document_generator'
import { DocusignBlock } from '@/blocks/blocks/docusign'
import { DropboxBlock } from '@/blocks/blocks/dropbox'
import { DropcontactBlock } from '@/blocks/blocks/dropcontact'
import { DSPyBlock } from '@/blocks/blocks/dspy'
import { DubBlock } from '@/blocks/blocks/dub'
import { DuckDuckGoBlock } from '@/blocks/blocks/duckduckgo'
import { DynamoDBBlock } from '@/blocks/blocks/dynamodb'
import { ElasticsearchBlock } from '@/blocks/blocks/elasticsearch'
import { ElevenLabsBlock } from '@/blocks/blocks/elevenlabs'
import { EmailBisonBlock } from '@/blocks/blocks/emailbison'
import { EnrichBlock } from '@/blocks/blocks/enrich'
import { EnrowBlock } from '@/blocks/blocks/enrow'
import { EvaluatorBlock } from '@/blocks/blocks/evaluator'
import { EvernoteBlock } from '@/blocks/blocks/evernote'
import { ExaBlock } from '@/blocks/blocks/exa'
import { ExtendBlock } from '@/blocks/blocks/extend'
import { FathomBlock } from '@/blocks/blocks/fathom'
import { FileBlock } from '@/blocks/blocks/file'
import { FindymailBlock } from '@/blocks/blocks/findymail'
import { FirecrawlBlock } from '@/blocks/blocks/firecrawl'
import { FirefliesBlock } from '@/blocks/blocks/fireflies'
import { FunctionBlock } from '@/blocks/blocks/function'
import { GammaBlock } from '@/blocks/blocks/gamma'
import { GenericWebhookBlock } from '@/blocks/blocks/generic_webhook'
import { GitHubBlock } from '@/blocks/blocks/github'
import { GitlabBlock } from '@/blocks/blocks/gitlab'
import { GmailBlock } from '@/blocks/blocks/gmail'
import { GongBlock } from '@/blocks/blocks/gong'
import { GoogleSearchBlock } from '@/blocks/blocks/google'
import { GoogleAdsBlock } from '@/blocks/blocks/google_ads'
import { GoogleBigQueryBlock } from '@/blocks/blocks/google_bigquery'
import { GoogleBooksBlock } from '@/blocks/blocks/google_books'
import { GoogleCalendarBlock } from '@/blocks/blocks/google_calendar'
import { GoogleContactsBlock } from '@/blocks/blocks/google_contacts'
import { GoogleDocsBlock } from '@/blocks/blocks/google_docs'
import { GoogleDriveBlock } from '@/blocks/blocks/google_drive'
import { GoogleFormsBlock } from '@/blocks/blocks/google_forms'
import { GoogleGroupsBlock } from '@/blocks/blocks/google_groups'
import { GoogleMapsBlock } from '@/blocks/blocks/google_maps'
import { GoogleMeetBlock } from '@/blocks/blocks/google_meet'
import { GooglePagespeedBlock } from '@/blocks/blocks/google_pagespeed'
import { GoogleSheetsBlock } from '@/blocks/blocks/google_sheets'
import { GoogleSlidesBlock } from '@/blocks/blocks/google_slides'
import { GoogleTasksBlock } from '@/blocks/blocks/google_tasks'
import { GoogleTranslateBlock } from '@/blocks/blocks/google_translate'
import { GoogleVaultBlock } from '@/blocks/blocks/google_vault'
import { GrafanaBlock } from '@/blocks/blocks/grafana'
import { GrainBlock } from '@/blocks/blocks/grain'
import { GranolaBlock } from '@/blocks/blocks/granola'
import { GreenhouseBlock } from '@/blocks/blocks/greenhouse'
import { GreptileBlock } from '@/blocks/blocks/greptile'
import { GuardrailsBlock } from '@/blocks/blocks/guardrails'
import { HexBlock } from '@/blocks/blocks/hex'
import { HubspotBlock } from '@/blocks/blocks/hubspot'
import { HuggingFaceBlock } from '@/blocks/blocks/huggingface'
import { HumanInTheLoopBlock } from '@/blocks/blocks/human_in_the_loop'
import { HunterBlock } from '@/blocks/blocks/hunter'
import { IamBlock } from '@/blocks/blocks/iam'
import { IcypeasBlock } from '@/blocks/blocks/icypeas'
import { IdentityCenterBlock } from '@/blocks/blocks/identity_center'
import { ImageGeneratorBlock } from '@/blocks/blocks/image_generator'
import { ImageSearchBlock } from '@/blocks/blocks/image_search'
import { IncidentioBlock } from '@/blocks/blocks/incidentio'
import { InfisicalBlock } from '@/blocks/blocks/infisical'
import { InputTriggerBlock } from '@/blocks/blocks/input_trigger'
import { InstantlyBlock } from '@/blocks/blocks/instantly'
import { IntercomBlock } from '@/blocks/blocks/intercom'
import { JinaBlock } from '@/blocks/blocks/jina'
import { JiraBlock } from '@/blocks/blocks/jira'
import { JiraServiceManagementBlock } from '@/blocks/blocks/jira_service_management'
import { KalshiBlock } from '@/blocks/blocks/kalshi'
import { KetchBlock } from '@/blocks/blocks/ketch'
import { KnowledgeBlock } from '@/blocks/blocks/knowledge'
import { LangSmithBlock } from '@/blocks/blocks/langsmith'
import { LatexBlock } from '@/blocks/blocks/latex'
import { LaunchDarklyBlock } from '@/blocks/blocks/launchdarkly'
import { LeadMagicBlock } from '@/blocks/blocks/leadmagic'
import { LemlistBlock } from '@/blocks/blocks/lemlist'
import { LinearBlock } from '@/blocks/blocks/linear'
import { LinkedInBlock } from '@/blocks/blocks/linkedin'
import { LinkupBlock } from '@/blocks/blocks/linkup'
import { LinqBlock } from '@/blocks/blocks/linq'
import { LogsBlock } from '@/blocks/blocks/logs'
import { LoopBlock } from '@/blocks/blocks/loop'
import { LoopsBlock } from '@/blocks/blocks/loops'
import { LumaBlock } from '@/blocks/blocks/luma'
import { MailchimpBlock } from '@/blocks/blocks/mailchimp'
import { MailgunBlock } from '@/blocks/blocks/mailgun'
import { ManualTriggerBlock } from '@/blocks/blocks/manual_trigger'
import { MCPBlock } from '@/blocks/blocks/mcp'
import { Mem0Block } from '@/blocks/blocks/mem0'
import { MemoryBlock } from '@/blocks/blocks/memory'
import { MicrosoftAdBlock } from '@/blocks/blocks/microsoft_ad'
import { MicrosoftDataverseBlock } from '@/blocks/blocks/microsoft_dataverse'
import { MicrosoftExcelBlock } from '@/blocks/blocks/microsoft_excel'
import { MicrosoftPlannerBlock } from '@/blocks/blocks/microsoft_planner'
import { MicrosoftTeamsBlock } from '@/blocks/blocks/microsoft_teams'
import { MillionVerifierBlock } from '@/blocks/blocks/millionverifier'
import { MistralParseBlock } from '@/blocks/blocks/mistral_parse'
import { MondayBlock } from '@/blocks/blocks/monday'
import { MongodbBlock } from '@/blocks/blocks/mongodb'
import { MSSQLBlock } from '@/blocks/blocks/mssql'
import { MySQLBlock } from '@/blocks/blocks/mysql'
import { Neo4jBlock } from '@/blocks/blocks/neo4j'
import { NeverbounceBlock } from '@/blocks/blocks/neverbounce'
import { NewRelicBlock } from '@/blocks/blocks/new_relic'
import { NoteBlock } from '@/blocks/blocks/note'
import { NotionBlock } from '@/blocks/blocks/notion'
import { ObsidianBlock } from '@/blocks/blocks/obsidian'
import { OktaBlock } from '@/blocks/blocks/okta'
import { OneDriveBlock } from '@/blocks/blocks/onedrive'
import { OnePasswordBlock } from '@/blocks/blocks/onepassword'
import { OpenAIBlock } from '@/blocks/blocks/openai'
import { OutlookBlock } from '@/blocks/blocks/outlook'
import { PagerDutyBlock } from '@/blocks/blocks/pagerduty'
import { ParallelBlock } from '@/blocks/blocks/parallel'
import { PeopleDataLabsBlock } from '@/blocks/blocks/peopledatalabs'
import { PerplexityBlock } from '@/blocks/blocks/perplexity'
import { PersonaBlock } from '@/blocks/blocks/persona'
import { PineconeBlock } from '@/blocks/blocks/pinecone'
import { PipedriveBlock } from '@/blocks/blocks/pipedrive'
import { PolymarketBlock } from '@/blocks/blocks/polymarket'
import { PostgreSQLBlock } from '@/blocks/blocks/postgresql'
import { PostHogBlock } from '@/blocks/blocks/posthog'
import { ProfoundBlock } from '@/blocks/blocks/profound'
import { ProspeoBlock } from '@/blocks/blocks/prospeo'
import { PulseBlock } from '@/blocks/blocks/pulse'
import { QdrantBlock } from '@/blocks/blocks/qdrant'
import { QuartrBlock } from '@/blocks/blocks/quartr'
import { QuiverBlock } from '@/blocks/blocks/quiver'
import { RailwayBlock } from '@/blocks/blocks/railway'
import { Rb2bBlock } from '@/blocks/blocks/rb2b'
import { RedditBlock } from '@/blocks/blocks/reddit'
import { ReductoBlock } from '@/blocks/blocks/reducto'
import { ResendBlock } from '@/blocks/blocks/resend'
import { ResponseBlock } from '@/blocks/blocks/response'
import { RevenueCatBlock } from '@/blocks/blocks/revenuecat'
import { RipplingBlock } from '@/blocks/blocks/rippling'
import { RootlyBlock } from '@/blocks/blocks/rootly'
import { RouterBlock } from '@/blocks/blocks/router'
import { RssBlock } from '@/blocks/blocks/rss'
import { S3Block } from '@/blocks/blocks/s3'
import { SalesforceBlock } from '@/blocks/blocks/salesforce'
import { SapConcurBlock } from '@/blocks/blocks/sap_concur'
import { SapS4HanaBlock } from '@/blocks/blocks/sap_s4hana'
import { ScheduleBlock } from '@/blocks/blocks/schedule'
import { SearchBlock } from '@/blocks/blocks/search'
import { SecretsManagerBlock } from '@/blocks/blocks/secrets_manager'
import { SendblueBlock } from '@/blocks/blocks/sendblue'
import { SendgridBlock } from '@/blocks/blocks/sendgrid'
import { SentryBlock } from '@/blocks/blocks/sentry'
import { SerperBlock } from '@/blocks/blocks/serper'
import { ServiceNowBlock } from '@/blocks/blocks/servicenow'
import { SesBlock } from '@/blocks/blocks/ses'
import { SharepointBlock } from '@/blocks/blocks/sharepoint'
import { ShopifyBlock } from '@/blocks/blocks/shopify'
import { SimilarwebBlock } from '@/blocks/blocks/similarweb'
import { SixtyfourBlock } from '@/blocks/blocks/sixtyfour'
import { SlackBlock } from '@/blocks/blocks/slack'
import { SMTPBlock } from '@/blocks/blocks/smtp'
import { SnowflakeBlock } from '@/blocks/blocks/snowflake'
import { SpotifyBlock } from '@/blocks/blocks/spotify'
import { SqsBlock } from '@/blocks/blocks/sqs'
import { SquareBlock } from '@/blocks/blocks/square'
import { StagehandBlock } from '@/blocks/blocks/stagehand'
import { StagehandAgentBlock } from '@/blocks/blocks/stagehand_agent'
import { StartTriggerBlock } from '@/blocks/blocks/start_trigger'
import { StarterBlock } from '@/blocks/blocks/starter'
import { StripeBlock } from '@/blocks/blocks/stripe'
import { StsBlock } from '@/blocks/blocks/sts'
import { SttBlock } from '@/blocks/blocks/stt'
import { SupabaseBlock } from '@/blocks/blocks/supabase'
import { SwitchBlock } from '@/blocks/blocks/switch'
import { TableBlock } from '@/blocks/blocks/table'
import { TailscaleBlock } from '@/blocks/blocks/tailscale'
import { TavilyBlock } from '@/blocks/blocks/tavily'
import { TelegramBlock } from '@/blocks/blocks/telegram'
import { TextractBlock } from '@/blocks/blocks/textract'
import { ThinkingBlock } from '@/blocks/blocks/thinking'
import { TinybirdBlock } from '@/blocks/blocks/tinybird'
import { TranslateBlock } from '@/blocks/blocks/translate'
import { TrelloBlock } from '@/blocks/blocks/trello'
import { TriggerDevBlock } from '@/blocks/blocks/trigger_dev'
import { TtsBlock } from '@/blocks/blocks/tts'
import { TwilioSMSBlock } from '@/blocks/blocks/twilio'
import { TwilioVoiceBlock } from '@/blocks/blocks/twilio_voice'
import { TypeformBlock } from '@/blocks/blocks/typeform'
import { UpstashBlock } from '@/blocks/blocks/upstash'
import { VantaBlock } from '@/blocks/blocks/vanta'
import { VariablesBlock } from '@/blocks/blocks/variables'
import { VercelBlock } from '@/blocks/blocks/vercel'
import { VideoGeneratorBlock } from '@/blocks/blocks/video_generator'
import { VisionBlock } from '@/blocks/blocks/vision'
import { WaitBlock } from '@/blocks/blocks/wait'
import { WealthboxBlock } from '@/blocks/blocks/wealthbox'
import { WebflowBlock } from '@/blocks/blocks/webflow'
import { WebhookBlock } from '@/blocks/blocks/webhook'
import { WhatsAppBlock } from '@/blocks/blocks/whatsapp'
import { WikipediaBlock } from '@/blocks/blocks/wikipedia'
import { WizaBlock } from '@/blocks/blocks/wiza'
import { WordpressBlock } from '@/blocks/blocks/wordpress'
import { WorkdayBlock } from '@/blocks/blocks/workday'
import { WorkflowBlock } from '@/blocks/blocks/workflow'
import { WorkflowInputBlock } from '@/blocks/blocks/workflow_input'
import { XBlock } from '@/blocks/blocks/x'
import { YouTubeBlock } from '@/blocks/blocks/youtube'
import { ZelaxyArenaBlock } from '@/blocks/blocks/zelaxy_arena'
import { ZendeskBlock } from '@/blocks/blocks/zendesk'
import { ZeroBounceBlock } from '@/blocks/blocks/zerobounce'
import { ZoomBlock } from '@/blocks/blocks/zoom'
import { ZoomInfoBlock } from '@/blocks/blocks/zoominfo'
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
  document_generator: DocumentGeneratorBlock,
  sqs: SqsBlock,
  // Phase 2 — AWS (SigV4) + remaining HTTP/DB
  ses: SesBlock,
  textract: TextractBlock,
  secrets_manager: SecretsManagerBlock,
  sts: StsBlock,
  iam: IamBlock,
  codepipeline: CodepipelineBlock,
  google_ads: GoogleAdsBlock,
  google_vault: GoogleVaultBlock,
  obsidian: ObsidianBlock,
  mongodb: MongodbBlock,
  neo4j: Neo4jBlock,
  identity_center: IdentityCenterBlock,
  appconfig: AppConfigBlock,
  stripe: StripeBlock,
  // Phase 2 integrations
  hubspot: HubspotBlock,
  salesforce: SalesforceBlock,
  pipedrive: PipedriveBlock,
  gitlab: GitlabBlock,
  sentry: SentryBlock,
  gong: GongBlock,
  zoom: ZoomBlock,
  intercom: IntercomBlock,
  greenhouse: GreenhouseBlock,
  trello: TrelloBlock,
  monday: MondayBlock,
  fireflies: FirefliesBlock,
  shopify: ShopifyBlock,
  square: SquareBlock,
  webflow: WebflowBlock,
  wordpress: WordpressBlock,
  spotify: SpotifyBlock,
  zendesk: ZendeskBlock,
  loops: LoopsBlock,
  lemlist: LemlistBlock,
  sendgrid: SendgridBlock,
  mailgun: MailgunBlock,
  mailchimp: MailchimpBlock,
  instantly: InstantlyBlock,
  sendblue: SendblueBlock,
  twilio_voice: TwilioVoiceBlock,
  clickhouse: ClickhouseBlock,
  upstash: UpstashBlock,
  tinybird: TinybirdBlock,
  convex: ConvexBlock,
  // Phase 2 — Tiers E & F
  zoominfo: ZoomInfoBlock,
  peopledatalabs: PeopleDataLabsBlock,
  leadmagic: LeadMagicBlock,
  datagma: DatagmaBlock,
  dropcontact: DropcontactBlock,
  enrow: EnrowBlock,
  findymail: FindymailBlock,
  icypeas: IcypeasBlock,
  prospeo: ProspeoBlock,
  rb2b: Rb2bBlock,
  wiza: WizaBlock,
  persona: PersonaBlock,
  millionverifier: MillionVerifierBlock,
  neverbounce: NeverbounceBlock,
  zerobounce: ZeroBounceBlock,
  similarweb: SimilarwebBlock,
  vercel: VercelBlock,
  railway: RailwayBlock,
  daytona: DaytonaBlock,
  trigger_dev: TriggerDevBlock,
  grafana: GrafanaBlock,
  new_relic: NewRelicBlock,
  posthog: PostHogBlock,
  langsmith: LangSmithBlock,
  launchdarkly: LaunchDarklyBlock,
  pagerduty: PagerDutyBlock,
  incidentio: IncidentioBlock,
  rootly: RootlyBlock,
  tailscale: TailscaleBlock,
  infisical: InfisicalBlock,
  onepassword: OnePasswordBlock,
  greptile: GreptileBlock,
  context_dev: ContextDevBlock,
  // Phase 2 — Tiers D, G & H
  google_forms: GoogleFormsBlock,
  google_tasks: GoogleTasksBlock,
  google_contacts: GoogleContactsBlock,
  google_slides: GoogleSlidesBlock,
  google_translate: GoogleTranslateBlock,
  google_maps: GoogleMapsBlock,
  google_books: GoogleBooksBlock,
  google_pagespeed: GooglePagespeedBlock,
  google_bigquery: GoogleBigQueryBlock,
  google_meet: GoogleMeetBlock,
  google_groups: GoogleGroupsBlock,
  servicenow: ServiceNowBlock,
  jira_service_management: JiraServiceManagementBlock,
  okta: OktaBlock,
  workday: WorkdayBlock,
  rippling: RipplingBlock,
  vanta: VantaBlock,
  ketch: KetchBlock,
  brex: BrexBlock,
  revenuecat: RevenueCatBlock,
  microsoft_dataverse: MicrosoftDataverseBlock,
  microsoft_ad: MicrosoftAdBlock,
  sap_s4hana: SapS4HanaBlock,
  sap_concur: SapConcurBlock,
  latex: LatexBlock,
  reducto: ReductoBlock,
  extend: ExtendBlock,
  stt: SttBlock,
  tts: TtsBlock,
  quartr: QuartrBlock,
  linq: LinqBlock,
  rss: RssBlock,
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
  // Key MUST equal block.type ('zelaxy-arena') — getBlock(type)=registry[type] and the
  // toolbar drags using block.type, so an underscore key here made the block undraggable.
  'zelaxy-arena': ZelaxyArenaBlock,
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
