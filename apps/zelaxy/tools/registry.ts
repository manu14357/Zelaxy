// Provider tools - handled separately
import {
  a2aCancelTaskTool,
  a2aGetAgentCardTool,
  a2aGetTaskTool,
  a2aResubscribeTool,
  a2aSendMessageTool,
  a2aSetPushNotificationTool,
} from '@/tools/a2a'
import {
  agentmailCreateDraftTool,
  agentmailForwardMessageTool,
  agentmailGetThreadTool,
  agentmailListThreadsTool,
  agentmailReplyMessageTool,
  agentmailSendMessageTool,
} from '@/tools/agentmail'
import {
  agentphoneCreateCallTool,
  agentphoneCreateNumberTool,
  agentphoneListNumbersTool,
  agentphoneReleaseNumberTool,
  agentphoneSendMessageTool,
} from '@/tools/agentphone'
import {
  agiloftCreateRecordTool,
  agiloftDeleteRecordTool,
  agiloftQueryRecordsTool,
  agiloftReadRecordTool,
  agiloftUpdateRecordTool,
} from '@/tools/agiloft'
import {
  ahrefsBacklinksTool,
  ahrefsDomainRatingTool,
  ahrefsOrganicKeywordsTool,
  ahrefsReferringDomainsTool,
  ahrefsTopPagesTool,
} from '@/tools/ahrefs'
import {
  airtableCreateRecordsTool,
  airtableGetRecordTool,
  airtableListRecordsTool,
  airtableUpdateMultipleRecordsTool,
  airtableUpdateRecordTool,
} from '@/tools/airtable'
import { airweaveSearchTool } from '@/tools/airweave'
import {
  algoliaDeleteDocumentTool,
  algoliaGetDocumentTool,
  algoliaIndexDocumentTool,
  algoliaSearchTool,
  algoliaUpdateDocumentTool,
} from '@/tools/algolia'
import {
  amplitudeExportEventsTool,
  amplitudeGetUserActivityTool,
  amplitudeIdentifyUserTool,
  amplitudeSendEventTool,
  amplitudeUserSearchTool,
} from '@/tools/amplitude'
import {
  apifyGetDatasetTool,
  apifyGetRunTool,
  apifyRunActorAsyncTool,
  apifyRunActorSyncTool,
} from '@/tools/apify'
import {
  apolloFindEmailTool,
  apolloOrganizationEnrichTool,
  apolloOrganizationSearchTool,
  apolloPeopleEnrichTool,
  apolloPeopleSearchTool,
} from '@/tools/apollo'
import {
  appconfigListApplicationsTool,
  appconfigListConfigurationProfilesTool,
  appconfigListEnvironmentsTool,
} from '@/tools/appconfig'
import { arxivGetAuthorPapersTool, arxivGetPaperTool, arxivSearchTool } from '@/tools/arxiv'
import {
  asanaAddCommentTool,
  asanaCreateTaskTool,
  asanaDeleteTaskTool,
  asanaGetProjectsTool,
  asanaGetTaskTool,
  asanaSearchTasksTool,
  asanaUpdateTaskTool,
} from '@/tools/asana'
import {
  ashbyCreateCandidateTool,
  ashbyGetCandidateTool,
  ashbyGetJobPostingsTool,
  ashbyListApplicationsTool,
  ashbyListCandidatesTool,
  ashbyUpdateCandidateTool,
} from '@/tools/ashby'
import {
  athenaGetQueryExecutionTool,
  athenaGetQueryResultsTool,
  athenaListQueryExecutionsTool,
  athenaStartQueryTool,
  athenaStopQueryTool,
} from '@/tools/athena'
import {
  attioCreateNoteTool,
  attioCreateRecordTool,
  attioDeleteRecordTool,
  attioGetRecordTool,
  attioListNotesTool,
  attioListRecordsTool,
  attioUpdateRecordTool,
} from '@/tools/attio'
import {
  azureDevOpsCreateWorkItemTool,
  azureDevOpsGetPipelineRunTool,
  azureDevOpsGetWorkItemTool,
  azureDevOpsListPipelinesTool,
  azureDevOpsQueryWorkItemsTool,
  azureDevOpsRunPipelineTool,
  azureDevOpsUpdateWorkItemTool,
} from '@/tools/azure_devops'
import {
  boxCreateFolderTool,
  boxCreateSharedLinkTool,
  boxDeleteFileTool,
  boxDownloadFileTool,
  boxGetFileInfoTool,
  boxListFolderTool,
  boxUploadFileTool,
} from '@/tools/box'
import { brandfetchGetBrandTool, brandfetchSearchTool } from '@/tools/brandfetch'
// Phase 2 — Tiers D, G & H (Google Workspace / enterprise / files & media)
import {
  brexListCashAccountsTool,
  brexListCashTransactionsTool,
  brexListUsersTool,
} from '@/tools/brex'
import {
  brightDataDiscoverTool,
  brightDataScrapeUrlTool,
  brightDataSerpSearchTool,
} from '@/tools/brightdata'
import { browserUseRunTaskTool } from '@/tools/browser_use'
import {
  calcomCancelBookingTool,
  calcomCreateBookingTool,
  calcomGetBookingTool,
  calcomGetSlotsTool,
  calcomListBookingsTool,
  calcomListEventTypesTool,
} from '@/tools/calcom'
import {
  calendlyCancelEventTool,
  calendlyGetCurrentUserTool,
  calendlyGetEventTypeTool,
  calendlyGetScheduledEventTool,
  calendlyListEventInviteesTool,
  calendlyListEventTypesTool,
  calendlyListScheduledEventsTool,
} from '@/tools/calendly'
import { clayPopulateTool } from '@/tools/clay'
import {
  clerkCreateOrganizationTool,
  clerkCreateUserTool,
  clerkDeleteUserTool,
  clerkGetOrganizationTool,
  clerkGetUserTool,
  clerkListOrganizationsTool,
  clerkListSessionsTool,
  clerkListUsersTool,
  clerkRevokeSessionTool,
  clerkUpdateUserTool,
} from '@/tools/clerk'
// Phase 2 integrations
import { clickhousePingTool, clickhouseQueryTool } from '@/tools/clickhouse'
import {
  cloudflareCreateDnsRecordTool,
  cloudflareDeleteDnsRecordTool,
  cloudflareGetZoneTool,
  cloudflareListDnsRecordsTool,
  cloudflareListZonesTool,
  cloudflarePurgeCacheTool,
  cloudflareUpdateDnsRecordTool,
} from '@/tools/cloudflare'
import {
  cloudformationDescribeStackEventsTool,
  cloudformationDescribeStacksTool,
  cloudformationDetectStackDriftTool,
  cloudformationGetTemplateTool,
  cloudformationListStackResourcesTool,
  cloudformationValidateTemplateTool,
} from '@/tools/cloudformation'
import {
  cloudwatchDescribeAlarmsTool,
  cloudwatchDescribeLogGroupsTool,
  cloudwatchGetLogEventsTool,
  cloudwatchGetMetricStatisticsTool,
  cloudwatchListMetricsTool,
  cloudwatchPutMetricDataTool,
  cloudwatchQueryLogsTool,
} from '@/tools/cloudwatch'
// Phase 2 — AWS (SigV4) + remaining HTTP/DB integrations
import {
  codepipelineGetPipelineStateTool,
  codepipelineGetPipelineTool,
  codepipelineListPipelinesTool,
} from '@/tools/codepipeline'
import { confluenceRetrieveTool, confluenceUpdateTool } from '@/tools/confluence'
// Phase 2 — Tiers E & F (DevOps / observability / enrichment)
import {
  contextDevCrawlTool,
  contextDevScrapeMarkdownTool,
  contextDevSearchTool,
} from '@/tools/context_dev'
import { convexRunMutationTool, convexRunQueryTool } from '@/tools/convex'
import {
  crowdstrikeGetSensorAggregatesTool,
  crowdstrikeGetSensorDetailsTool,
  crowdstrikeQuerySensorsTool,
} from '@/tools/crowdstrike'
import {
  cursorAddFollowupTool,
  cursorGetAgentTool,
  cursorGetConversationTool,
  cursorLaunchAgentTool,
  cursorListAgentsTool,
  cursorStopAgentTool,
} from '@/tools/cursor'
import {
  dagsterGetRunLogsTool,
  dagsterGetRunTool,
  dagsterLaunchRunTool,
  dagsterListJobsTool,
  dagsterListRunsTool,
  dagsterListSchedulesTool,
  dagsterTerminateRunTool,
} from '@/tools/dagster'
import {
  databricksExecuteSqlTool,
  databricksGetRunStatusTool,
  databricksListCatalogsTool,
  databricksListClustersTool,
  databricksListJobsTool,
  databricksRunJobTool,
} from '@/tools/databricks'
import {
  datadogCreateIncidentTool,
  datadogListDashboardsTool,
  datadogListIncidentsTool,
  datadogListMonitorsTool,
  datadogQueryLogsTool,
  datadogQueryMetricsTool,
} from '@/tools/datadog'
import { datagmaEnrichPersonTool, datagmaFindEmailTool } from '@/tools/datagma'
import {
  daytonaCreateWorkspaceTool,
  daytonaGetWorkspaceTool,
  daytonaListWorkspacesTool,
} from '@/tools/daytona'
import { delayTool } from '@/tools/delay'
import {
  devinAddSecretTool,
  devinCreateSessionTool,
  devinDeleteSecretTool,
  devinGetSessionTool,
  devinGetSnapshotTool,
  devinListSessionsTool,
  devinSendMessageTool,
} from '@/tools/devin'
import {
  discordGetMessagesTool,
  discordGetServerTool,
  discordGetUserTool,
  discordSendMessageTool,
} from '@/tools/discord'
import {
  docusignCreateEnvelopeTool,
  docusignGetEnvelopeTool,
  docusignGetSigningUrlTool,
  docusignListEnvelopesTool,
  docusignSendEnvelopeTool,
  docusignVoidEnvelopeTool,
} from '@/tools/docusign'
// Platform subsystems — document generation
import { docxGenerateTool } from '@/tools/docx_generate'
import {
  dropboxCreateFolderTool,
  dropboxCreateSharedLinkTool,
  dropboxDeleteFileTool,
  dropboxDownloadFileTool,
  dropboxGetFileMetadataTool,
  dropboxListFolderTool,
  dropboxSearchFilesTool,
  dropboxUploadFileTool,
} from '@/tools/dropbox'
import { dropcontactEnrichTool, dropcontactGetBatchTool } from '@/tools/dropcontact'
import { dspyRunTool } from '@/tools/dspy'
import {
  dubCreateLinkTool,
  dubDeleteLinkTool,
  dubGetAnalyticsTool,
  dubGetLinkTool,
  dubListLinksTool,
  dubUpdateLinkTool,
} from '@/tools/dub'
import {
  duckduckgoImagesSearchTool,
  duckduckgoNewsSearchTool,
  duckduckgoTextSearchTool,
} from '@/tools/duckduckgo'
import {
  dynamodbBatchWriteTool,
  dynamodbDeleteItemTool,
  dynamodbGetItemTool,
  dynamodbPutItemTool,
  dynamodbQueryTool,
  dynamodbScanTool,
  dynamodbUpdateItemTool,
} from '@/tools/dynamodb'
import {
  elasticsearchBulkTool,
  elasticsearchDeleteTool,
  elasticsearchGetTool,
  elasticsearchIndexTool,
  elasticsearchListIndicesTool,
  elasticsearchSearchTool,
} from '@/tools/elasticsearch'
import { elevenLabsTtsTool } from '@/tools/elevenlabs'
import {
  emailbisonBulkFindTool,
  emailbisonDomainSearchTool,
  emailbisonFindEmailTool,
  emailbisonVerifyEmailTool,
} from '@/tools/emailbison'
import {
  enrichCompanyLookupTool,
  enrichEmailToProfileTool,
  enrichFindEmailTool,
  enrichPhoneFinderTool,
  enrichSearchPeopleTool,
  enrichVerifyEmailTool,
} from '@/tools/enrich'
import { enrowFindEmailTool, enrowGetResultTool, enrowVerifyEmailTool } from '@/tools/enrow'
import {
  evernoteCreateNoteTool,
  evernoteDeleteNoteTool,
  evernoteGetNoteTool,
  evernoteListNotebooksTool,
  evernoteSearchNotesTool,
  evernoteUpdateNoteTool,
} from '@/tools/evernote'
import {
  exaAnswerTool,
  exaFindSimilarLinksTool,
  exaGetContentsTool,
  exaResearchTool,
  exaSearchTool,
} from '@/tools/exa'
import { extendGetRunTool, extendParseTool } from '@/tools/extend'
import {
  fathomGetSummaryTool,
  fathomGetTranscriptTool,
  fathomListMeetingsTool,
  fathomListTeamMembersTool,
  fathomListTeamsTool,
} from '@/tools/fathom'
import { fileAppendTool, fileParseTool, fileWriteTool } from '@/tools/file'
import {
  findymailFindEmailTool,
  findymailFindFromLinkedinTool,
  findymailVerifyEmailTool,
} from '@/tools/findymail'
import { crawlTool, scrapeTool, searchTool } from '@/tools/firecrawl'
import {
  firefliesGetTranscriptTool,
  firefliesGetUserTool,
  firefliesListTranscriptsTool,
} from '@/tools/fireflies'
import { functionExecuteTool } from '@/tools/function'
import {
  gammaCheckStatusTool,
  gammaGenerateFromTemplateTool,
  gammaGenerateTool,
  gammaListFoldersTool,
  gammaListThemesTool,
} from '@/tools/gamma'
import {
  githubCommentTool,
  githubLatestCommitTool,
  githubPrTool,
  githubRepoInfoTool,
} from '@/tools/github'
import {
  gitlabCreateIssueTool,
  gitlabGetFileTool,
  gitlabGetProjectTool,
  gitlabListIssuesTool,
  gitlabListProjectsTool,
} from '@/tools/gitlab'
import { gmailDraftTool, gmailReadTool, gmailSearchTool, gmailSendTool } from '@/tools/gmail'
import { gongGetCallTool, gongListCallsTool, gongListUsersTool } from '@/tools/gong'
import { searchTool as googleSearchTool } from '@/tools/google'
import { googleAdsListCampaignsTool, googleAdsSearchTool } from '@/tools/google_ads'
import {
  googleBigqueryListDatasetsTool,
  googleBigqueryListTablesTool,
  googleBigqueryQueryTool,
} from '@/tools/google_bigquery'
import { googleBooksGetVolumeTool, googleBooksSearchVolumesTool } from '@/tools/google_books'
import {
  googleCalendarCreateTool,
  googleCalendarGetTool,
  googleCalendarInviteTool,
  googleCalendarListTool,
  googleCalendarQuickAddTool,
} from '@/tools/google_calendar'
import {
  googleContactsCreateContactTool,
  googleContactsGetContactTool,
  googleContactsListContactsTool,
  googleContactsSearchContactsTool,
} from '@/tools/google_contacts'
import { googleDocsCreateTool, googleDocsReadTool, googleDocsWriteTool } from '@/tools/google_docs'
import {
  googleDriveCreateFolderTool,
  googleDriveGetContentTool,
  googleDriveListTool,
  googleDriveUploadTool,
} from '@/tools/google_drive'
import {
  googleFormsGetFormTool,
  googleFormsGetResponseTool,
  googleFormsListResponsesTool,
} from '@/tools/google_forms'
import {
  googleGroupsAddMemberTool,
  googleGroupsGetGroupTool,
  googleGroupsListGroupsTool,
  googleGroupsListMembersTool,
} from '@/tools/google_groups'
import {
  googleMapsDirectionsTool,
  googleMapsGeocodeTool,
  googleMapsPlaceSearchTool,
  googleMapsReverseGeocodeTool,
} from '@/tools/google_maps'
import {
  googleMeetCreateSpaceTool,
  googleMeetGetSpaceTool,
  googleMeetListConferenceRecordsTool,
} from '@/tools/google_meet'
import { googlePagespeedAnalyzeTool } from '@/tools/google_pagespeed'
import {
  googleSheetsAppendTool,
  googleSheetsReadTool,
  googleSheetsUpdateTool,
  googleSheetsWriteTool,
} from '@/tools/google_sheets'
import {
  googleSlidesBatchUpdateTool,
  googleSlidesCreatePresentationTool,
  googleSlidesGetPresentationTool,
} from '@/tools/google_slides'
import {
  googleTasksCompleteTaskTool,
  googleTasksCreateTaskTool,
  googleTasksListTasklistsTool,
  googleTasksListTasksTool,
} from '@/tools/google_tasks'
import {
  googleTranslateDetectLanguageTool,
  googleTranslateListLanguagesTool,
  googleTranslateTranslateTool,
} from '@/tools/google_translate'
import {
  googleVaultCreateMatterTool,
  googleVaultGetMatterTool,
  googleVaultListExportsTool,
  googleVaultListMattersTool,
} from '@/tools/google_vault'
import {
  grafanaGetDashboardTool,
  grafanaListAlertsTool,
  grafanaListDatasourcesTool,
  grafanaSearchDashboardsTool,
} from '@/tools/grafana'
import {
  grainCreateHookTool,
  grainDeleteHookTool,
  grainGetRecordingTool,
  grainGetTranscriptTool,
  grainListHooksTool,
  grainListMeetingTypesTool,
  grainListRecordingsTool,
  grainListTeamsTool,
  grainListViewsTool,
} from '@/tools/grain'
import { granolaGetNoteTool, granolaListNotesTool } from '@/tools/granola'
import {
  greenhouseGetCandidateTool,
  greenhouseListApplicationsTool,
  greenhouseListCandidatesTool,
  greenhouseListJobsTool,
} from '@/tools/greenhouse'
import {
  greptileIndexRepositoryTool,
  greptileQueryTool,
  greptileSearchTool,
} from '@/tools/greptile'
import { guardrailsTool } from '@/tools/guardrails'
import {
  hexCancelRunTool,
  hexCreateCollectionTool,
  hexGetCollectionTool,
  hexGetDataConnectionTool,
  hexGetGroupTool,
  hexGetProjectRunsTool,
  hexGetProjectTool,
  hexGetQueriedTablesTool,
  hexGetRunStatusTool,
  hexListCollectionsTool,
  hexListDataConnectionsTool,
  hexListGroupsTool,
  hexListProjectsTool,
  hexListUsersTool,
  hexRunProjectTool,
  hexUpdateProjectTool,
} from '@/tools/hex'
import { requestTool as httpRequest } from '@/tools/http'
import {
  hubspotCreateContactTool,
  hubspotCreateDealTool,
  hubspotGetContactTool,
  hubspotListContactsTool,
  hubspotSearchContactsTool,
} from '@/tools/hubspot'
import { huggingfaceChatTool } from '@/tools/huggingface'
import {
  hunterCompaniesFindTool,
  hunterDiscoverTool,
  hunterDomainSearchTool,
  hunterEmailCountTool,
  hunterEmailFinderTool,
  hunterEmailVerifierTool,
} from '@/tools/hunter'
import { iamGetUserTool, iamListRolesTool, iamListUsersTool } from '@/tools/iam'
import {
  icypeasDomainSearchTool,
  icypeasEmailSearchTool,
  icypeasEmailVerificationTool,
} from '@/tools/icypeas'
import {
  identityCenterGetUserIdTool,
  identityCenterListGroupsTool,
  identityCenterListUsersTool,
} from '@/tools/identity_center'
import {
  imageSearchCatalogTool,
  imageSearchIngestTool,
  imageSearchStatusTool,
  imageSearchTool,
} from '@/tools/image_search'
import {
  incidentioCreateIncidentTool,
  incidentioGetIncidentTool,
  incidentioListIncidentsTool,
} from '@/tools/incidentio'
import {
  infisicalCreateSecretTool,
  infisicalGetSecretTool,
  infisicalListSecretsTool,
} from '@/tools/infisical'
import {
  instantlyCreateLeadTool,
  instantlyListCampaignsTool,
  instantlyListLeadsTool,
} from '@/tools/instantly'
import {
  intercomCreateContactTool,
  intercomGetContactTool,
  intercomListContactsTool,
  intercomSearchContactsTool,
} from '@/tools/intercom'
import { readUrlTool } from '@/tools/jina'
import { jiraBulkRetrieveTool, jiraRetrieveTool, jiraUpdateTool, jiraWriteTool } from '@/tools/jira'
import {
  jiraServiceManagementCreateRequestTool,
  jiraServiceManagementGetRequestTool,
  jiraServiceManagementListRequestsTool,
  jiraServiceManagementListServicedesksTool,
} from '@/tools/jira_service_management'
import {
  kalshiAmendOrderTool,
  kalshiCancelOrderTool,
  kalshiCreateOrderTool,
  kalshiGetBalanceTool,
  kalshiGetCandlesticksTool,
  kalshiGetEventsTool,
  kalshiGetEventTool,
  kalshiGetExchangeStatusTool,
  kalshiGetFillsTool,
  kalshiGetMarketsTool,
  kalshiGetMarketTool,
  kalshiGetOrderbookTool,
  kalshiGetOrdersTool,
  kalshiGetOrderTool,
  kalshiGetPositionsTool,
  kalshiGetSeriesByTickerTool,
  kalshiGetTradesTool,
} from '@/tools/kalshi'
import { ketchGetConsentTool, ketchInvokeRightTool, ketchSetConsentTool } from '@/tools/ketch'
import {
  knowledgeCreateDocumentTool,
  knowledgeSearchTool,
  knowledgeUploadChunkTool,
} from '@/tools/knowledge'
import {
  langsmithCreateFeedbackTool,
  langsmithGetRunTool,
  langsmithListRunsTool,
} from '@/tools/langsmith'
import { latexCompileTool, latexSearchPackagesTool } from '@/tools/latex'
import {
  launchdarklyGetFlagTool,
  launchdarklyListFlagsTool,
  launchdarklyListProjectsTool,
} from '@/tools/launchdarkly'
import {
  leadmagicEmailFinderTool,
  leadmagicEmailValidateTool,
  leadmagicProfileSearchTool,
} from '@/tools/leadmagic'
import {
  lemlistAddLeadTool,
  lemlistGetCampaignTool,
  lemlistListActivitiesTool,
  lemlistListCampaignsTool,
} from '@/tools/lemlist'
import { linearCreateIssueTool, linearReadIssuesTool } from '@/tools/linear'
import {
  linkedinCreatePostTool,
  linkedinDeletePostTool,
  linkedinGetCompanyTool,
  linkedinGetProfileTool,
} from '@/tools/linkedin'
import { linkupSearchTool } from '@/tools/linkup'
import { linqListChatsTool, linqListMessagesTool, linqSendMessageTool } from '@/tools/linq'
import { logsGetExecutionTool, logsGetTool, logsQueryTool } from '@/tools/logs'
import {
  loopsCreateContactTool,
  loopsSendEventTool,
  loopsSendTransactionalTool,
  loopsUpdateContactTool,
} from '@/tools/loops'
import {
  lumaAddGuestsTool,
  lumaCreateEventTool,
  lumaGetEventTool,
  lumaGetGuestsTool,
  lumaListEventsTool,
  lumaUpdateEventTool,
} from '@/tools/luma'
import {
  mailchimpAddMemberTool,
  mailchimpGetListTool,
  mailchimpListMembersTool,
} from '@/tools/mailchimp'
import { mailgunListEventsTool, mailgunSendEmailTool } from '@/tools/mailgun'
import {
  mcpConnectTool,
  mcpCreateServerTool,
  mcpDiscoverToolsTool,
  mcpExecuteToolTool,
} from '@/tools/mcp'
import { mem0AddMemoriesTool, mem0GetMemoriesTool, mem0SearchMemoriesTool } from '@/tools/mem0'
import { memoryAddTool, memoryDeleteTool, memoryGetAllTool, memoryGetTool } from '@/tools/memory'
import {
  microsoftAdCreateUserTool,
  microsoftAdGetUserTool,
  microsoftAdListGroupsTool,
  microsoftAdListUsersTool,
} from '@/tools/microsoft_ad'
import {
  microsoftDataverseCreateRecordTool,
  microsoftDataverseGetRecordTool,
  microsoftDataverseQueryRecordsTool,
} from '@/tools/microsoft_dataverse'
import {
  microsoftExcelReadTool,
  microsoftExcelTableAddTool,
  microsoftExcelUpdateTool,
  microsoftExcelWriteTool,
} from '@/tools/microsoft_excel'
import {
  microsoftPlannerCreateTaskTool,
  microsoftPlannerReadTaskTool,
} from '@/tools/microsoft_planner'
import {
  microsoftTeamsReadChannelTool,
  microsoftTeamsReadChatTool,
  microsoftTeamsWriteChannelTool,
  microsoftTeamsWriteChatTool,
} from '@/tools/microsoft_teams'
import {
  millionverifierGetCreditsTool,
  millionverifierVerifyEmailTool,
} from '@/tools/millionverifier'
import { mistralParserTool } from '@/tools/mistral'
import {
  mondayCreateItemTool,
  mondayGetBoardItemsTool,
  mondayListBoardsTool,
  mondayUpdateItemTool,
} from '@/tools/monday'
import {
  mongodbDeleteOneTool,
  mongodbFindTool,
  mongodbInsertOneTool,
  mongodbUpdateOneTool,
} from '@/tools/mongodb'
import { mssqlTool } from '@/tools/mssql'
import { mysqlTool } from '@/tools/mysql'
import { neo4jRunQueryTool } from '@/tools/neo4j'
import { neverbounceGetAccountTool, neverbounceVerifyEmailTool } from '@/tools/neverbounce'
import { newRelicListAlertPoliciesTool, newRelicNrqlQueryTool } from '@/tools/new_relic'
import {
  notionCreateDatabaseTool,
  notionCreatePageTool,
  notionQueryDatabaseTool,
  notionReadDatabaseTool,
  notionReadTool,
  notionSearchTool,
  notionWriteTool,
} from '@/tools/notion'
import { obsidianGetFileTool, obsidianListFilesTool, obsidianSearchTool } from '@/tools/obsidian'
import {
  oktaCreateUserTool,
  oktaGetUserTool,
  oktaListGroupsTool,
  oktaListUsersTool,
} from '@/tools/okta'
import { onedriveCreateFolderTool, onedriveListTool, onedriveUploadTool } from '@/tools/onedrive'
import {
  onepasswordGetItemTool,
  onepasswordListItemsTool,
  onepasswordListVaultsTool,
} from '@/tools/onepassword'
import { imageTool, embeddingsTool as openAIEmbeddings } from '@/tools/openai'
import { outlookDraftTool, outlookReadTool, outlookSendTool } from '@/tools/outlook'
import {
  pagerdutyCreateIncidentTool,
  pagerdutyGetIncidentTool,
  pagerdutyListIncidentsTool,
  pagerdutyListServicesTool,
} from '@/tools/pagerduty'
import { pdfGenerateTool } from '@/tools/pdf_generate'
import {
  peopledatalabsCompanyEnrichTool,
  peopledatalabsPersonEnrichTool,
  peopledatalabsPersonSearchTool,
} from '@/tools/peopledatalabs'
import { perplexityChatTool } from '@/tools/perplexity'
import {
  personaGetAccountTool,
  personaGetInquiryTool,
  personaListInquiriesTool,
} from '@/tools/persona'
import {
  pineconeFetchTool,
  pineconeGenerateEmbeddingsTool,
  pineconeSearchTextTool,
  pineconeSearchVectorTool,
  pineconeUpsertTextTool,
} from '@/tools/pinecone'
import {
  pipedriveCreateDealTool,
  pipedriveCreatePersonTool,
  pipedriveListDealsTool,
  pipedriveSearchDealsTool,
} from '@/tools/pipedrive'
import {
  polymarketGetActivityTool,
  polymarketGetEventsTool,
  polymarketGetEventTool,
  polymarketGetHoldersTool,
  polymarketGetLastTradePriceTool,
  polymarketGetLeaderboardTool,
  polymarketGetMarketsTool,
  polymarketGetMarketTool,
  polymarketGetMidpointTool,
  polymarketGetOrderbookTool,
  polymarketGetPositionsTool,
  polymarketGetPriceHistoryTool,
  polymarketGetPriceTool,
  polymarketGetSeriesByIdTool,
  polymarketGetSeriesTool,
  polymarketGetSpreadTool,
  polymarketGetTagsTool,
  polymarketGetTickSizeTool,
  polymarketGetTradesTool,
  polymarketSearchTool,
} from '@/tools/polymarket'
import { postgresqlTool } from '@/tools/postgresql'
import { posthogCaptureEventTool, posthogListInsightsTool, posthogQueryTool } from '@/tools/posthog'
import { pptxGenerateTool } from '@/tools/pptx_generate'
import {
  profoundBotLogsTool,
  profoundBotsReportTool,
  profoundCategoryAssetsTool,
  profoundCategoryPersonasTool,
  profoundCategoryPromptsTool,
  profoundCategoryTagsTool,
  profoundCategoryTopicsTool,
  profoundCitationPromptsTool,
  profoundCitationsReportTool,
  profoundListAssetsTool,
  profoundListCategoriesTool,
  profoundListDomainsTool,
  profoundListModelsTool,
  profoundListOptimizationsTool,
  profoundListPersonasTool,
  profoundListRegionsTool,
  profoundOptimizationAnalysisTool,
  profoundPromptAnswersTool,
  profoundPromptVolumeTool,
  profoundQueryFanoutsTool,
  profoundRawLogsTool,
  profoundReferralsReportTool,
  profoundSentimentReportTool,
  profoundVisibilityReportTool,
} from '@/tools/profound'
import {
  prospeoEmailFinderTool,
  prospeoLinkedinEmailFinderTool,
  prospeoMobileFinderTool,
} from '@/tools/prospeo'
import { pulseParserTool } from '@/tools/pulse'
import { qdrantFetchTool, qdrantSearchTool, qdrantUpsertTool } from '@/tools/qdrant'
import {
  quartrGetCompanyTool,
  quartrListCompaniesTool,
  quartrListDocumentsTool,
} from '@/tools/quartr'
import { quiverImageToSvgTool, quiverListModelsTool, quiverTextToSvgTool } from '@/tools/quiver'
import {
  railwayGetProjectTool,
  railwayListDeploymentsTool,
  railwayListProjectsTool,
} from '@/tools/railway'
import { rb2bGetVisitorTool, rb2bListVisitorsTool } from '@/tools/rb2b'
import { redditGetCommentsTool, redditGetPostsTool, redditHotPostsTool } from '@/tools/reddit'
import { reductoExtractTool, reductoParseTool, reductoSplitTool } from '@/tools/reducto'
import { resendBatchTool, resendCancelTool, resendGetTool, resendSendTool } from '@/tools/resend'
import {
  revenuecatGetCustomerTool,
  revenuecatGetSubscriptionTool,
  revenuecatListCustomersTool,
} from '@/tools/revenuecat'
import {
  ripplingGetWorkerTool,
  ripplingListCompaniesTool,
  ripplingListWorkersTool,
} from '@/tools/rippling'
import {
  rootlyCreateIncidentTool,
  rootlyGetIncidentTool,
  rootlyListIncidentsTool,
} from '@/tools/rootly'
import { rssFetchFeedTool, rssGetFeedInfoTool } from '@/tools/rss'
import { s3GetObjectTool } from '@/tools/s3'
import {
  salesforceCreateRecordTool,
  salesforceGetRecordTool,
  salesforceQueryTool,
  salesforceUpdateRecordTool,
} from '@/tools/salesforce'
import {
  sapConcurGetReportTool,
  sapConcurListReportsTool,
  sapConcurListUsersTool,
} from '@/tools/sap_concur'
import {
  sapS4hanaGetBusinessPartnersTool,
  sapS4hanaGetBusinessPartnerTool,
  sapS4hanaListProductsTool,
} from '@/tools/sap_s4hana'
import { searchTool as zelaxySearchTool } from '@/tools/search'
import {
  secretsManagerCreateSecretTool,
  secretsManagerGetSecretValueTool,
  secretsManagerListSecretsTool,
} from '@/tools/secrets_manager'
import { sendblueGetMessagesTool, sendblueSendMessageTool } from '@/tools/sendblue'
import {
  sendgridAddContactTool,
  sendgridListContactsTool,
  sendgridSendEmailTool,
} from '@/tools/sendgrid'
import {
  sentryGetIssueTool,
  sentryListIssuesTool,
  sentryListProjectsTool,
  sentryUpdateIssueTool,
} from '@/tools/sentry'
import { searchTool as serperSearch } from '@/tools/serper'
import {
  servicenowCreateRecordTool,
  servicenowGetRecordTool,
  servicenowQueryTableTool,
  servicenowUpdateRecordTool,
} from '@/tools/servicenow'
import { sesListIdentitiesTool, sesSendEmailTool } from '@/tools/ses'
import {
  sharepointCreatePageTool,
  sharepointListSitesTool,
  sharepointReadPageTool,
} from '@/tools/sharepoint'
import {
  shopifyCreateProductTool,
  shopifyGetOrderTool,
  shopifyListOrdersTool,
  shopifyListProductsTool,
} from '@/tools/shopify'
import { similarwebTotalTrafficTool, similarwebWebsiteRankTool } from '@/tools/similarweb'
import {
  sixtyfourEnrichCompanyTool,
  sixtyfourEnrichLeadTool,
  sixtyfourFindEmailTool,
  sixtyfourFindPhoneTool,
} from '@/tools/sixtyfour'
import { loadSkillTool } from '@/tools/skill/load'
import { slackCanvasTool, slackMessageReaderTool, slackMessageTool } from '@/tools/slack'
import { smtpSendTool } from '@/tools/smtp'
import { snowflakeTool } from '@/tools/snowflake'
import {
  spotifyGetArtistTool,
  spotifyGetPlaylistTool,
  spotifyGetTrackTool,
  spotifyListMyPlaylistsTool,
  spotifySearchTool,
} from '@/tools/spotify'
import { sqsListQueuesTool, sqsReceiveMessageTool, sqsSendMessageTool } from '@/tools/sqs'
import {
  squareCreateCustomerTool,
  squareGetPaymentTool,
  squareListCustomersTool,
  squareListPaymentsTool,
} from '@/tools/square'
import { stagehandAgentTool, stagehandExtractTool } from '@/tools/stagehand'
import {
  stripeCreateCustomerTool,
  stripeCreatePaymentIntentTool,
  stripeCreateRefundTool,
  stripeListChargesTool,
  stripeListCustomersTool,
} from '@/tools/stripe'
import { stsGetCallerIdentityTool, stsGetSessionTokenTool } from '@/tools/sts'
import { sttTranscribeTool } from '@/tools/stt'
import {
  supabaseDeleteTool,
  supabaseGetRowTool,
  supabaseInsertTool,
  supabaseQueryTool,
  supabaseUpdateTool,
} from '@/tools/supabase'
import {
  tableBatchInsertRowsTool,
  tableCreateTool,
  tableDeleteRowsByFilterTool,
  tableDeleteRowTool,
  tableGetRowTool,
  tableGetSchemaTool,
  tableInsertRowTool,
  tableListTool,
  tableQueryRowsTool,
  tableUpdateRowsByFilterTool,
  tableUpdateRowTool,
  tableUpsertRowTool,
} from '@/tools/table'
import {
  tailscaleGetDeviceTool,
  tailscaleListDevicesTool,
  tailscaleListKeysTool,
} from '@/tools/tailscale'
import { tavilyExtractTool, tavilySearchTool } from '@/tools/tavily'
import { telegramMessageTool } from '@/tools/telegram'
import { textractAnalyzeDocumentTool, textractDetectDocumentTextTool } from '@/tools/textract'
import { thinkingTool } from '@/tools/thinking'
import {
  tinybirdListDatasourcesTool,
  tinybirdListPipesTool,
  tinybirdQueryTool,
} from '@/tools/tinybird'
import {
  trelloCreateBoardTool,
  trelloCreateCardTool,
  trelloGetBoardTool,
  trelloListCardsTool,
  trelloMoveCardTool,
} from '@/tools/trello'
import {
  triggerDevGetRunTool,
  triggerDevListRunsTool,
  triggerDevTriggerTaskTool,
} from '@/tools/trigger_dev'
import { ttsSynthesizeTool } from '@/tools/tts'
import { sendSMSTool } from '@/tools/twilio'
import {
  twilioVoiceGetCallTool,
  twilioVoiceListCallsTool,
  twilioVoiceMakeCallTool,
} from '@/tools/twilio_voice'
import { typeformFilesTool, typeformInsightsTool, typeformResponsesTool } from '@/tools/typeform'
import type { ToolConfig } from '@/tools/types'
import { upstashRedisGetTool, upstashRedisSetTool, upstashRunCommandTool } from '@/tools/upstash'
import { vantaListControlsTool, vantaListTestsTool, vantaListVendorsTool } from '@/tools/vanta'
import {
  vercelCreateDeploymentTool,
  vercelGetDeploymentTool,
  vercelListDeploymentsTool,
  vercelListProjectsTool,
} from '@/tools/vercel'
import {
  falaiGenerateVideoTool,
  lumaGenerateVideoTool,
  minimaxGenerateVideoTool,
  runwayGenerateVideoTool,
  veoGenerateVideoTool,
} from '@/tools/video_generator'
import { visionTool } from '@/tools/vision'
import {
  wealthboxReadContactTool,
  wealthboxReadNoteTool,
  wealthboxReadTaskTool,
  wealthboxWriteContactTool,
  wealthboxWriteNoteTool,
  wealthboxWriteTaskTool,
} from '@/tools/wealthbox'
import {
  webflowCreateCollectionItemTool,
  webflowListCollectionItemsTool,
  webflowListCollectionsTool,
  webflowListSitesTool,
} from '@/tools/webflow'
import { whatsappSendMessageTool } from '@/tools/whatsapp'
import {
  wikipediaPageContentTool,
  wikipediaPageSummaryTool,
  wikipediaRandomPageTool,
  wikipediaSearchTool,
} from '@/tools/wikipedia'
import {
  wizaCreateListTool,
  wizaGetContactsTool,
  wizaGetListTool,
  wizaRevealIndividualTool,
} from '@/tools/wiza'
import {
  wordpressCreatePostTool,
  wordpressGetPostTool,
  wordpressListPostsTool,
  wordpressUpdatePostTool,
} from '@/tools/wordpress'
import { workdayGetWorkersTool, workdayGetWorkerTool } from '@/tools/workday'
import { workflowExecutorTool } from '@/tools/workflow'
import { xReadTool, xSearchTool, xUserTool, xWriteTool } from '@/tools/x'
import { youtubeSearchTool } from '@/tools/youtube'
import {
  zendeskCreateTicketTool,
  zendeskGetTicketTool,
  zendeskListTicketsTool,
  zendeskSearchTool,
  zendeskUpdateTicketTool,
} from '@/tools/zendesk'
import { zerobounceGetCreditsTool, zerobounceValidateEmailTool } from '@/tools/zerobounce'
import {
  zoomCreateMeetingTool,
  zoomGetMeetingTool,
  zoomListMeetingsTool,
  zoomListUsersTool,
} from '@/tools/zoom'
import {
  zoominfoEnrichCompanyTool,
  zoominfoEnrichContactTool,
  zoominfoSearchContactTool,
} from '@/tools/zoominfo'

// Registry of all available tools
export const tools: Record<string, ToolConfig> = {
  arxiv_search: arxivSearchTool,
  arxiv_get_paper: arxivGetPaperTool,
  arxiv_get_author_papers: arxivGetAuthorPapersTool,
  browser_use_run_task: browserUseRunTaskTool,
  openai_embeddings: openAIEmbeddings,
  http_request: httpRequest,
  huggingface_chat: huggingfaceChatTool,
  function_execute: functionExecuteTool,
  guardrails_validate: guardrailsTool,
  vision_tool: visionTool,
  file_parser: fileParseTool,
  file_write: fileWriteTool,
  file_append: fileAppendTool,
  load_skill: loadSkillTool,
  firecrawl_scrape: scrapeTool,
  firecrawl_search: searchTool,
  firecrawl_crawl: crawlTool,
  google_search: googleSearchTool,
  jina_read_url: readUrlTool,
  linkup_search: linkupSearchTool,
  jira_retrieve: jiraRetrieveTool,
  jira_update: jiraUpdateTool,
  jira_write: jiraWriteTool,
  jira_bulk_read: jiraBulkRetrieveTool,
  slack_message: slackMessageTool,
  slack_message_reader: slackMessageReaderTool,
  slack_canvas: slackCanvasTool,
  smtp_send: smtpSendTool,
  snowflake_connector: snowflakeTool,
  pdf_generate: pdfGenerateTool,
  docx_generate: docxGenerateTool,
  pptx_generate: pptxGenerateTool,
  sqs_send_message: sqsSendMessageTool,
  sqs_receive_message: sqsReceiveMessageTool,
  sqs_list_queues: sqsListQueuesTool,
  // Phase 2 — AWS (SigV4) + remaining HTTP/DB
  ses_send_email: sesSendEmailTool,
  ses_list_identities: sesListIdentitiesTool,
  textract_detect_document_text: textractDetectDocumentTextTool,
  textract_analyze_document: textractAnalyzeDocumentTool,
  secrets_manager_get_secret_value: secretsManagerGetSecretValueTool,
  secrets_manager_list_secrets: secretsManagerListSecretsTool,
  secrets_manager_create_secret: secretsManagerCreateSecretTool,
  sts_get_caller_identity: stsGetCallerIdentityTool,
  sts_get_session_token: stsGetSessionTokenTool,
  iam_list_users: iamListUsersTool,
  iam_list_roles: iamListRolesTool,
  iam_get_user: iamGetUserTool,
  codepipeline_list_pipelines: codepipelineListPipelinesTool,
  codepipeline_get_pipeline: codepipelineGetPipelineTool,
  codepipeline_get_pipeline_state: codepipelineGetPipelineStateTool,
  google_ads_search: googleAdsSearchTool,
  google_ads_list_campaigns: googleAdsListCampaignsTool,
  google_vault_list_matters: googleVaultListMattersTool,
  google_vault_get_matter: googleVaultGetMatterTool,
  google_vault_create_matter: googleVaultCreateMatterTool,
  google_vault_list_exports: googleVaultListExportsTool,
  obsidian_list_files: obsidianListFilesTool,
  obsidian_get_file: obsidianGetFileTool,
  obsidian_search: obsidianSearchTool,
  mongodb_find: mongodbFindTool,
  mongodb_insert_one: mongodbInsertOneTool,
  mongodb_update_one: mongodbUpdateOneTool,
  mongodb_delete_one: mongodbDeleteOneTool,
  neo4j_run_query: neo4jRunQueryTool,
  identity_center_list_users: identityCenterListUsersTool,
  identity_center_list_groups: identityCenterListGroupsTool,
  identity_center_get_user_id: identityCenterGetUserIdTool,
  appconfig_list_applications: appconfigListApplicationsTool,
  appconfig_list_environments: appconfigListEnvironmentsTool,
  appconfig_list_configuration_profiles: appconfigListConfigurationProfilesTool,
  stripe_create_customer: stripeCreateCustomerTool,
  stripe_list_customers: stripeListCustomersTool,
  stripe_create_payment_intent: stripeCreatePaymentIntentTool,
  stripe_list_charges: stripeListChargesTool,
  stripe_create_refund: stripeCreateRefundTool,
  // Phase 2 integrations
  hubspot_create_contact: hubspotCreateContactTool,
  hubspot_get_contact: hubspotGetContactTool,
  hubspot_list_contacts: hubspotListContactsTool,
  hubspot_search_contacts: hubspotSearchContactsTool,
  hubspot_create_deal: hubspotCreateDealTool,
  salesforce_create_record: salesforceCreateRecordTool,
  salesforce_query: salesforceQueryTool,
  salesforce_update_record: salesforceUpdateRecordTool,
  salesforce_get_record: salesforceGetRecordTool,
  pipedrive_create_deal: pipedriveCreateDealTool,
  pipedrive_list_deals: pipedriveListDealsTool,
  pipedrive_create_person: pipedriveCreatePersonTool,
  pipedrive_search_deals: pipedriveSearchDealsTool,
  gitlab_list_projects: gitlabListProjectsTool,
  gitlab_get_project: gitlabGetProjectTool,
  gitlab_list_issues: gitlabListIssuesTool,
  gitlab_create_issue: gitlabCreateIssueTool,
  gitlab_get_file: gitlabGetFileTool,
  sentry_list_projects: sentryListProjectsTool,
  sentry_list_issues: sentryListIssuesTool,
  sentry_get_issue: sentryGetIssueTool,
  sentry_update_issue: sentryUpdateIssueTool,
  gong_list_calls: gongListCallsTool,
  gong_get_call: gongGetCallTool,
  gong_list_users: gongListUsersTool,
  zoom_list_meetings: zoomListMeetingsTool,
  zoom_create_meeting: zoomCreateMeetingTool,
  zoom_get_meeting: zoomGetMeetingTool,
  zoom_list_users: zoomListUsersTool,
  intercom_create_contact: intercomCreateContactTool,
  intercom_list_contacts: intercomListContactsTool,
  intercom_get_contact: intercomGetContactTool,
  intercom_search_contacts: intercomSearchContactsTool,
  greenhouse_list_candidates: greenhouseListCandidatesTool,
  greenhouse_get_candidate: greenhouseGetCandidateTool,
  greenhouse_list_jobs: greenhouseListJobsTool,
  greenhouse_list_applications: greenhouseListApplicationsTool,
  trello_create_card: trelloCreateCardTool,
  trello_list_cards: trelloListCardsTool,
  trello_get_board: trelloGetBoardTool,
  trello_create_board: trelloCreateBoardTool,
  trello_move_card: trelloMoveCardTool,
  monday_list_boards: mondayListBoardsTool,
  monday_get_board_items: mondayGetBoardItemsTool,
  monday_create_item: mondayCreateItemTool,
  monday_update_item: mondayUpdateItemTool,
  fireflies_list_transcripts: firefliesListTranscriptsTool,
  fireflies_get_transcript: firefliesGetTranscriptTool,
  fireflies_get_user: firefliesGetUserTool,
  shopify_list_products: shopifyListProductsTool,
  shopify_create_product: shopifyCreateProductTool,
  shopify_list_orders: shopifyListOrdersTool,
  shopify_get_order: shopifyGetOrderTool,
  square_list_customers: squareListCustomersTool,
  square_create_customer: squareCreateCustomerTool,
  square_list_payments: squareListPaymentsTool,
  square_get_payment: squareGetPaymentTool,
  webflow_list_sites: webflowListSitesTool,
  webflow_list_collections: webflowListCollectionsTool,
  webflow_list_collection_items: webflowListCollectionItemsTool,
  webflow_create_collection_item: webflowCreateCollectionItemTool,
  wordpress_create_post: wordpressCreatePostTool,
  wordpress_list_posts: wordpressListPostsTool,
  wordpress_get_post: wordpressGetPostTool,
  wordpress_update_post: wordpressUpdatePostTool,
  spotify_search: spotifySearchTool,
  spotify_get_track: spotifyGetTrackTool,
  spotify_get_artist: spotifyGetArtistTool,
  spotify_get_playlist: spotifyGetPlaylistTool,
  spotify_list_my_playlists: spotifyListMyPlaylistsTool,
  zendesk_create_ticket: zendeskCreateTicketTool,
  zendesk_list_tickets: zendeskListTicketsTool,
  zendesk_get_ticket: zendeskGetTicketTool,
  zendesk_update_ticket: zendeskUpdateTicketTool,
  zendesk_search: zendeskSearchTool,
  loops_create_contact: loopsCreateContactTool,
  loops_update_contact: loopsUpdateContactTool,
  loops_send_event: loopsSendEventTool,
  loops_send_transactional: loopsSendTransactionalTool,
  lemlist_list_campaigns: lemlistListCampaignsTool,
  lemlist_get_campaign: lemlistGetCampaignTool,
  lemlist_add_lead: lemlistAddLeadTool,
  lemlist_list_activities: lemlistListActivitiesTool,
  sendgrid_send_email: sendgridSendEmailTool,
  sendgrid_add_contact: sendgridAddContactTool,
  sendgrid_list_contacts: sendgridListContactsTool,
  mailgun_send_email: mailgunSendEmailTool,
  mailgun_list_events: mailgunListEventsTool,
  mailchimp_add_member: mailchimpAddMemberTool,
  mailchimp_list_members: mailchimpListMembersTool,
  mailchimp_get_list: mailchimpGetListTool,
  instantly_list_campaigns: instantlyListCampaignsTool,
  instantly_create_lead: instantlyCreateLeadTool,
  instantly_list_leads: instantlyListLeadsTool,
  sendblue_send_message: sendblueSendMessageTool,
  sendblue_get_messages: sendblueGetMessagesTool,
  twilio_voice_make_call: twilioVoiceMakeCallTool,
  twilio_voice_list_calls: twilioVoiceListCallsTool,
  twilio_voice_get_call: twilioVoiceGetCallTool,
  clickhouse_query: clickhouseQueryTool,
  clickhouse_ping: clickhousePingTool,
  upstash_redis_get: upstashRedisGetTool,
  upstash_redis_set: upstashRedisSetTool,
  upstash_run_command: upstashRunCommandTool,
  tinybird_query: tinybirdQueryTool,
  tinybird_list_pipes: tinybirdListPipesTool,
  tinybird_list_datasources: tinybirdListDatasourcesTool,
  convex_run_query: convexRunQueryTool,
  convex_run_mutation: convexRunMutationTool,
  // Phase 2 — Tiers E & F
  zoominfo_enrich_contact: zoominfoEnrichContactTool,
  zoominfo_enrich_company: zoominfoEnrichCompanyTool,
  zoominfo_search_contact: zoominfoSearchContactTool,
  peopledatalabs_person_enrich: peopledatalabsPersonEnrichTool,
  peopledatalabs_company_enrich: peopledatalabsCompanyEnrichTool,
  peopledatalabs_person_search: peopledatalabsPersonSearchTool,
  leadmagic_email_finder: leadmagicEmailFinderTool,
  leadmagic_profile_search: leadmagicProfileSearchTool,
  leadmagic_email_validate: leadmagicEmailValidateTool,
  datagma_enrich_person: datagmaEnrichPersonTool,
  datagma_find_email: datagmaFindEmailTool,
  dropcontact_enrich: dropcontactEnrichTool,
  dropcontact_get_batch: dropcontactGetBatchTool,
  enrow_find_email: enrowFindEmailTool,
  enrow_verify_email: enrowVerifyEmailTool,
  enrow_get_result: enrowGetResultTool,
  findymail_find_email: findymailFindEmailTool,
  findymail_find_from_linkedin: findymailFindFromLinkedinTool,
  findymail_verify_email: findymailVerifyEmailTool,
  icypeas_email_search: icypeasEmailSearchTool,
  icypeas_email_verification: icypeasEmailVerificationTool,
  icypeas_domain_search: icypeasDomainSearchTool,
  prospeo_email_finder: prospeoEmailFinderTool,
  prospeo_mobile_finder: prospeoMobileFinderTool,
  prospeo_linkedin_email_finder: prospeoLinkedinEmailFinderTool,
  rb2b_list_visitors: rb2bListVisitorsTool,
  rb2b_get_visitor: rb2bGetVisitorTool,
  wiza_create_list: wizaCreateListTool,
  wiza_get_list: wizaGetListTool,
  wiza_get_contacts: wizaGetContactsTool,
  wiza_reveal_individual: wizaRevealIndividualTool,
  persona_list_inquiries: personaListInquiriesTool,
  persona_get_inquiry: personaGetInquiryTool,
  persona_get_account: personaGetAccountTool,
  millionverifier_verify_email: millionverifierVerifyEmailTool,
  millionverifier_get_credits: millionverifierGetCreditsTool,
  neverbounce_verify_email: neverbounceVerifyEmailTool,
  neverbounce_get_account: neverbounceGetAccountTool,
  zerobounce_validate_email: zerobounceValidateEmailTool,
  zerobounce_get_credits: zerobounceGetCreditsTool,
  similarweb_total_traffic: similarwebTotalTrafficTool,
  similarweb_website_rank: similarwebWebsiteRankTool,
  vercel_list_projects: vercelListProjectsTool,
  vercel_list_deployments: vercelListDeploymentsTool,
  vercel_get_deployment: vercelGetDeploymentTool,
  vercel_create_deployment: vercelCreateDeploymentTool,
  railway_list_projects: railwayListProjectsTool,
  railway_get_project: railwayGetProjectTool,
  railway_list_deployments: railwayListDeploymentsTool,
  daytona_list_workspaces: daytonaListWorkspacesTool,
  daytona_get_workspace: daytonaGetWorkspaceTool,
  daytona_create_workspace: daytonaCreateWorkspaceTool,
  trigger_dev_trigger_task: triggerDevTriggerTaskTool,
  trigger_dev_get_run: triggerDevGetRunTool,
  trigger_dev_list_runs: triggerDevListRunsTool,
  grafana_search_dashboards: grafanaSearchDashboardsTool,
  grafana_get_dashboard: grafanaGetDashboardTool,
  grafana_list_datasources: grafanaListDatasourcesTool,
  grafana_list_alerts: grafanaListAlertsTool,
  new_relic_nrql_query: newRelicNrqlQueryTool,
  new_relic_list_alert_policies: newRelicListAlertPoliciesTool,
  posthog_capture_event: posthogCaptureEventTool,
  posthog_query: posthogQueryTool,
  posthog_list_insights: posthogListInsightsTool,
  langsmith_list_runs: langsmithListRunsTool,
  langsmith_get_run: langsmithGetRunTool,
  langsmith_create_feedback: langsmithCreateFeedbackTool,
  launchdarkly_list_flags: launchdarklyListFlagsTool,
  launchdarkly_get_flag: launchdarklyGetFlagTool,
  launchdarkly_list_projects: launchdarklyListProjectsTool,
  pagerduty_list_incidents: pagerdutyListIncidentsTool,
  pagerduty_create_incident: pagerdutyCreateIncidentTool,
  pagerduty_get_incident: pagerdutyGetIncidentTool,
  pagerduty_list_services: pagerdutyListServicesTool,
  incidentio_list_incidents: incidentioListIncidentsTool,
  incidentio_create_incident: incidentioCreateIncidentTool,
  incidentio_get_incident: incidentioGetIncidentTool,
  rootly_list_incidents: rootlyListIncidentsTool,
  rootly_create_incident: rootlyCreateIncidentTool,
  rootly_get_incident: rootlyGetIncidentTool,
  tailscale_list_devices: tailscaleListDevicesTool,
  tailscale_get_device: tailscaleGetDeviceTool,
  tailscale_list_keys: tailscaleListKeysTool,
  infisical_list_secrets: infisicalListSecretsTool,
  infisical_get_secret: infisicalGetSecretTool,
  infisical_create_secret: infisicalCreateSecretTool,
  onepassword_list_vaults: onepasswordListVaultsTool,
  onepassword_list_items: onepasswordListItemsTool,
  onepassword_get_item: onepasswordGetItemTool,
  greptile_query: greptileQueryTool,
  greptile_search: greptileSearchTool,
  greptile_index_repository: greptileIndexRepositoryTool,
  context_dev_search: contextDevSearchTool,
  context_dev_scrape_markdown: contextDevScrapeMarkdownTool,
  context_dev_crawl: contextDevCrawlTool,
  // Phase 2 — Tiers D, G & H
  google_forms_get_form: googleFormsGetFormTool,
  google_forms_list_responses: googleFormsListResponsesTool,
  google_forms_get_response: googleFormsGetResponseTool,
  google_tasks_list_tasklists: googleTasksListTasklistsTool,
  google_tasks_list_tasks: googleTasksListTasksTool,
  google_tasks_create_task: googleTasksCreateTaskTool,
  google_tasks_complete_task: googleTasksCompleteTaskTool,
  google_contacts_list_contacts: googleContactsListContactsTool,
  google_contacts_get_contact: googleContactsGetContactTool,
  google_contacts_search_contacts: googleContactsSearchContactsTool,
  google_contacts_create_contact: googleContactsCreateContactTool,
  google_slides_get_presentation: googleSlidesGetPresentationTool,
  google_slides_create_presentation: googleSlidesCreatePresentationTool,
  google_slides_batch_update: googleSlidesBatchUpdateTool,
  google_translate_translate: googleTranslateTranslateTool,
  google_translate_detect_language: googleTranslateDetectLanguageTool,
  google_translate_list_languages: googleTranslateListLanguagesTool,
  google_maps_geocode: googleMapsGeocodeTool,
  google_maps_reverse_geocode: googleMapsReverseGeocodeTool,
  google_maps_place_search: googleMapsPlaceSearchTool,
  google_maps_directions: googleMapsDirectionsTool,
  google_books_search_volumes: googleBooksSearchVolumesTool,
  google_books_get_volume: googleBooksGetVolumeTool,
  google_pagespeed_analyze: googlePagespeedAnalyzeTool,
  google_bigquery_query: googleBigqueryQueryTool,
  google_bigquery_list_datasets: googleBigqueryListDatasetsTool,
  google_bigquery_list_tables: googleBigqueryListTablesTool,
  google_meet_create_space: googleMeetCreateSpaceTool,
  google_meet_get_space: googleMeetGetSpaceTool,
  google_meet_list_conference_records: googleMeetListConferenceRecordsTool,
  google_groups_list_groups: googleGroupsListGroupsTool,
  google_groups_get_group: googleGroupsGetGroupTool,
  google_groups_list_members: googleGroupsListMembersTool,
  google_groups_add_member: googleGroupsAddMemberTool,
  servicenow_query_table: servicenowQueryTableTool,
  servicenow_create_record: servicenowCreateRecordTool,
  servicenow_get_record: servicenowGetRecordTool,
  servicenow_update_record: servicenowUpdateRecordTool,
  jira_service_management_list_servicedesks: jiraServiceManagementListServicedesksTool,
  jira_service_management_create_request: jiraServiceManagementCreateRequestTool,
  jira_service_management_get_request: jiraServiceManagementGetRequestTool,
  jira_service_management_list_requests: jiraServiceManagementListRequestsTool,
  okta_list_users: oktaListUsersTool,
  okta_get_user: oktaGetUserTool,
  okta_create_user: oktaCreateUserTool,
  okta_list_groups: oktaListGroupsTool,
  workday_get_workers: workdayGetWorkersTool,
  workday_get_worker: workdayGetWorkerTool,
  rippling_list_workers: ripplingListWorkersTool,
  rippling_get_worker: ripplingGetWorkerTool,
  rippling_list_companies: ripplingListCompaniesTool,
  vanta_list_tests: vantaListTestsTool,
  vanta_list_controls: vantaListControlsTool,
  vanta_list_vendors: vantaListVendorsTool,
  ketch_get_consent: ketchGetConsentTool,
  ketch_set_consent: ketchSetConsentTool,
  ketch_invoke_right: ketchInvokeRightTool,
  brex_list_cash_accounts: brexListCashAccountsTool,
  brex_list_cash_transactions: brexListCashTransactionsTool,
  brex_list_users: brexListUsersTool,
  revenuecat_get_customer: revenuecatGetCustomerTool,
  revenuecat_list_customers: revenuecatListCustomersTool,
  revenuecat_get_subscription: revenuecatGetSubscriptionTool,
  microsoft_dataverse_query_records: microsoftDataverseQueryRecordsTool,
  microsoft_dataverse_create_record: microsoftDataverseCreateRecordTool,
  microsoft_dataverse_get_record: microsoftDataverseGetRecordTool,
  microsoft_ad_list_users: microsoftAdListUsersTool,
  microsoft_ad_get_user: microsoftAdGetUserTool,
  microsoft_ad_list_groups: microsoftAdListGroupsTool,
  microsoft_ad_create_user: microsoftAdCreateUserTool,
  sap_s4hana_get_business_partners: sapS4hanaGetBusinessPartnersTool,
  sap_s4hana_get_business_partner: sapS4hanaGetBusinessPartnerTool,
  sap_s4hana_list_products: sapS4hanaListProductsTool,
  sap_concur_list_reports: sapConcurListReportsTool,
  sap_concur_get_report: sapConcurGetReportTool,
  sap_concur_list_users: sapConcurListUsersTool,
  latex_compile: latexCompileTool,
  latex_search_packages: latexSearchPackagesTool,
  reducto_parse: reductoParseTool,
  reducto_extract: reductoExtractTool,
  reducto_split: reductoSplitTool,
  extend_parse: extendParseTool,
  extend_get_run: extendGetRunTool,
  stt_transcribe: sttTranscribeTool,
  tts_synthesize: ttsSynthesizeTool,
  quartr_get_company: quartrGetCompanyTool,
  quartr_list_companies: quartrListCompaniesTool,
  quartr_list_documents: quartrListDocumentsTool,
  linq_send_message: linqSendMessageTool,
  linq_list_chats: linqListChatsTool,
  linq_list_messages: linqListMessagesTool,
  rss_fetch_feed: rssFetchFeedTool,
  rss_get_feed_info: rssGetFeedInfoTool,
  github_repo_info: githubRepoInfoTool,
  github_latest_commit: githubLatestCommitTool,
  serper_search: serperSearch,
  tavily_search: tavilySearchTool,
  tavily_extract: tavilyExtractTool,
  supabase_query: supabaseQueryTool,
  supabase_insert: supabaseInsertTool,
  supabase_get_row: supabaseGetRowTool,
  supabase_update: supabaseUpdateTool,
  supabase_delete: supabaseDeleteTool,
  typeform_responses: typeformResponsesTool,
  typeform_files: typeformFilesTool,
  typeform_insights: typeformInsightsTool,
  youtube_search: youtubeSearchTool,
  notion_read: notionReadTool,
  notion_read_database: notionReadDatabaseTool,
  notion_write: notionWriteTool,
  notion_create_page: notionCreatePageTool,
  notion_query_database: notionQueryDatabaseTool,
  notion_search: notionSearchTool,
  notion_create_database: notionCreateDatabaseTool,
  gmail_send: gmailSendTool,
  gmail_read: gmailReadTool,
  gmail_search: gmailSearchTool,
  gmail_draft: gmailDraftTool,
  whatsapp_send_message: whatsappSendMessageTool,
  x_write: xWriteTool,
  x_read: xReadTool,
  x_search: xSearchTool,
  x_user: xUserTool,
  linkedin_create_post: linkedinCreatePostTool,
  linkedin_get_profile: linkedinGetProfileTool,
  linkedin_get_company: linkedinGetCompanyTool,
  linkedin_delete_post: linkedinDeletePostTool,
  pinecone_fetch: pineconeFetchTool,
  pinecone_generate_embeddings: pineconeGenerateEmbeddingsTool,
  pinecone_search_text: pineconeSearchTextTool,
  pinecone_search_vector: pineconeSearchVectorTool,
  pinecone_upsert_text: pineconeUpsertTextTool,
  github_pr: githubPrTool,
  github_comment: githubCommentTool,
  exa_search: exaSearchTool,
  exa_get_contents: exaGetContentsTool,
  exa_find_similar_links: exaFindSimilarLinksTool,
  exa_answer: exaAnswerTool,
  exa_research: exaResearchTool,
  reddit_hot_posts: redditHotPostsTool,
  reddit_get_posts: redditGetPostsTool,
  reddit_get_comments: redditGetCommentsTool,
  resend_send: resendSendTool,
  resend_batch: resendBatchTool,
  resend_get: resendGetTool,
  resend_cancel: resendCancelTool,
  google_drive_get_content: googleDriveGetContentTool,
  google_drive_list: googleDriveListTool,
  google_drive_upload: googleDriveUploadTool,
  google_drive_create_folder: googleDriveCreateFolderTool,
  google_docs_read: googleDocsReadTool,
  google_docs_write: googleDocsWriteTool,
  google_docs_create: googleDocsCreateTool,
  google_sheets_read: googleSheetsReadTool,
  google_sheets_write: googleSheetsWriteTool,
  google_sheets_update: googleSheetsUpdateTool,
  google_sheets_append: googleSheetsAppendTool,
  perplexity_chat: perplexityChatTool,
  confluence_retrieve: confluenceRetrieveTool,
  confluence_update: confluenceUpdateTool,
  twilio_send_sms: sendSMSTool,
  airtable_create_records: airtableCreateRecordsTool,
  airtable_get_record: airtableGetRecordTool,
  airtable_list_records: airtableListRecordsTool,
  airtable_update_record: airtableUpdateRecordTool,
  airtable_update_multiple_records: airtableUpdateMultipleRecordsTool,
  mistral_parser: mistralParserTool,
  thinking_tool: thinkingTool,
  stagehand_extract: stagehandExtractTool,
  stagehand_agent: stagehandAgentTool,
  mem0_add_memories: mem0AddMemoriesTool,
  mem0_search_memories: mem0SearchMemoriesTool,
  mem0_get_memories: mem0GetMemoriesTool,
  memory_add: memoryAddTool,
  memory_get: memoryGetTool,
  memory_get_all: memoryGetAllTool,
  memory_delete: memoryDeleteTool,
  knowledge_search: knowledgeSearchTool,
  knowledge_upload_chunk: knowledgeUploadChunkTool,
  knowledge_create_document: knowledgeCreateDocumentTool,
  table_create: tableCreateTool,
  table_list: tableListTool,
  table_query_rows: tableQueryRowsTool,
  table_insert_row: tableInsertRowTool,
  table_upsert_row: tableUpsertRowTool,
  table_batch_insert_rows: tableBatchInsertRowsTool,
  table_update_row: tableUpdateRowTool,
  table_update_rows_by_filter: tableUpdateRowsByFilterTool,
  table_delete_row: tableDeleteRowTool,
  table_delete_rows_by_filter: tableDeleteRowsByFilterTool,
  table_get_row: tableGetRowTool,
  table_get_schema: tableGetSchemaTool,
  mssql_database: mssqlTool,
  mysql_database: mysqlTool,
  postgresql_database: postgresqlTool,
  elevenlabs_tts: elevenLabsTtsTool,
  s3_get_object: s3GetObjectTool,
  telegram_message: telegramMessageTool,
  clay_populate: clayPopulateTool,
  delay_wait: delayTool,
  discord_send_message: discordSendMessageTool,
  discord_get_messages: discordGetMessagesTool,
  discord_get_server: discordGetServerTool,
  discord_get_user: discordGetUserTool,
  openai_image: imageTool,
  microsoft_teams_read_chat: microsoftTeamsReadChatTool,
  microsoft_teams_write_chat: microsoftTeamsWriteChatTool,
  microsoft_teams_read_channel: microsoftTeamsReadChannelTool,
  microsoft_teams_write_channel: microsoftTeamsWriteChannelTool,
  outlook_read: outlookReadTool,
  outlook_send: outlookSendTool,
  outlook_draft: outlookDraftTool,
  linear_read_issues: linearReadIssuesTool,
  linear_create_issue: linearCreateIssueTool,
  onedrive_create_folder: onedriveCreateFolderTool,
  onedrive_list: onedriveListTool,
  onedrive_upload: onedriveUploadTool,
  microsoft_excel_read: microsoftExcelReadTool,
  microsoft_excel_write: microsoftExcelWriteTool,
  microsoft_excel_update: microsoftExcelUpdateTool,
  microsoft_excel_table_add: microsoftExcelTableAddTool,
  microsoft_planner_create_task: microsoftPlannerCreateTaskTool,
  microsoft_planner_read_task: microsoftPlannerReadTaskTool,
  google_calendar_create: googleCalendarCreateTool,
  google_calendar_get: googleCalendarGetTool,
  google_calendar_list: googleCalendarListTool,
  google_calendar_quick_add: googleCalendarQuickAddTool,
  google_calendar_invite: googleCalendarInviteTool,
  workflow_executor: workflowExecutorTool,
  wealthbox_read_contact: wealthboxReadContactTool,
  wealthbox_write_contact: wealthboxWriteContactTool,
  wealthbox_read_task: wealthboxReadTaskTool,
  wealthbox_write_task: wealthboxWriteTaskTool,
  wealthbox_read_note: wealthboxReadNoteTool,
  wealthbox_write_note: wealthboxWriteNoteTool,
  wikipedia_summary: wikipediaPageSummaryTool,
  wikipedia_search: wikipediaSearchTool,
  wikipedia_content: wikipediaPageContentTool,
  wikipedia_random: wikipediaRandomPageTool,
  qdrant_fetch_points: qdrantFetchTool,
  qdrant_search_vector: qdrantSearchTool,
  qdrant_upsert_points: qdrantUpsertTool,
  hunter_discover: hunterDiscoverTool,
  hunter_domain_search: hunterDomainSearchTool,
  hunter_email_finder: hunterEmailFinderTool,
  hunter_email_verifier: hunterEmailVerifierTool,
  hunter_companies_find: hunterCompaniesFindTool,
  hunter_email_count: hunterEmailCountTool,
  image_search_catalog: imageSearchCatalogTool,
  image_search_ingest: imageSearchIngestTool,
  image_search_search: imageSearchTool,
  image_search_status: imageSearchStatusTool,
  sharepoint_create_page: sharepointCreatePageTool,
  sharepoint_read_page: sharepointReadPageTool,
  sharepoint_list_sites: sharepointListSitesTool,
  mcp_connect: mcpConnectTool,
  mcp_create_server: mcpCreateServerTool,
  mcp_discover_tools: mcpDiscoverToolsTool,
  mcp_execute_tool: mcpExecuteToolTool,
  // New tool integrations
  a2a_send_message: a2aSendMessageTool,
  a2a_get_task: a2aGetTaskTool,
  a2a_cancel_task: a2aCancelTaskTool,
  a2a_get_agent_card: a2aGetAgentCardTool,
  a2a_resubscribe: a2aResubscribeTool,
  a2a_set_push_notification: a2aSetPushNotificationTool,
  agentmail_send_message: agentmailSendMessageTool,
  agentmail_reply_message: agentmailReplyMessageTool,
  agentmail_forward_message: agentmailForwardMessageTool,
  agentmail_list_threads: agentmailListThreadsTool,
  agentmail_get_thread: agentmailGetThreadTool,
  agentmail_create_draft: agentmailCreateDraftTool,
  agentphone_create_number: agentphoneCreateNumberTool,
  agentphone_list_numbers: agentphoneListNumbersTool,
  agentphone_release_number: agentphoneReleaseNumberTool,
  agentphone_send_message: agentphoneSendMessageTool,
  agentphone_create_call: agentphoneCreateCallTool,
  agiloft_create_record: agiloftCreateRecordTool,
  agiloft_read_record: agiloftReadRecordTool,
  agiloft_update_record: agiloftUpdateRecordTool,
  agiloft_delete_record: agiloftDeleteRecordTool,
  agiloft_query_records: agiloftQueryRecordsTool,
  ahrefs_domain_rating: ahrefsDomainRatingTool,
  ahrefs_backlinks: ahrefsBacklinksTool,
  ahrefs_organic_keywords: ahrefsOrganicKeywordsTool,
  ahrefs_top_pages: ahrefsTopPagesTool,
  ahrefs_referring_domains: ahrefsReferringDomainsTool,
  airweave_search: airweaveSearchTool,
  algolia_search: algoliaSearchTool,
  algolia_index_document: algoliaIndexDocumentTool,
  algolia_update_document: algoliaUpdateDocumentTool,
  algolia_delete_document: algoliaDeleteDocumentTool,
  algolia_get_document: algoliaGetDocumentTool,
  amplitude_send_event: amplitudeSendEventTool,
  amplitude_identify_user: amplitudeIdentifyUserTool,
  amplitude_user_search: amplitudeUserSearchTool,
  amplitude_get_user_activity: amplitudeGetUserActivityTool,
  amplitude_export_events: amplitudeExportEventsTool,
  apify_run_actor_sync: apifyRunActorSyncTool,
  apify_run_actor_async: apifyRunActorAsyncTool,
  apify_get_run: apifyGetRunTool,
  apify_get_dataset: apifyGetDatasetTool,
  apollo_people_search: apolloPeopleSearchTool,
  apollo_people_enrich: apolloPeopleEnrichTool,
  apollo_organization_search: apolloOrganizationSearchTool,
  apollo_organization_enrich: apolloOrganizationEnrichTool,
  apollo_find_email: apolloFindEmailTool,
  asana_get_task: asanaGetTaskTool,
  asana_create_task: asanaCreateTaskTool,
  asana_update_task: asanaUpdateTaskTool,
  asana_delete_task: asanaDeleteTaskTool,
  asana_get_projects: asanaGetProjectsTool,
  asana_search_tasks: asanaSearchTasksTool,
  asana_add_comment: asanaAddCommentTool,
  ashby_list_candidates: ashbyListCandidatesTool,
  ashby_get_candidate: ashbyGetCandidateTool,
  ashby_create_candidate: ashbyCreateCandidateTool,
  ashby_update_candidate: ashbyUpdateCandidateTool,
  ashby_list_applications: ashbyListApplicationsTool,
  ashby_get_job_postings: ashbyGetJobPostingsTool,
  athena_start_query: athenaStartQueryTool,
  athena_get_query_results: athenaGetQueryResultsTool,
  athena_get_query_execution: athenaGetQueryExecutionTool,
  athena_stop_query: athenaStopQueryTool,
  athena_list_query_executions: athenaListQueryExecutionsTool,
  attio_list_records: attioListRecordsTool,
  attio_get_record: attioGetRecordTool,
  attio_create_record: attioCreateRecordTool,
  attio_update_record: attioUpdateRecordTool,
  attio_delete_record: attioDeleteRecordTool,
  attio_create_note: attioCreateNoteTool,
  attio_list_notes: attioListNotesTool,
  azure_devops_list_pipelines: azureDevOpsListPipelinesTool,
  azure_devops_run_pipeline: azureDevOpsRunPipelineTool,
  azure_devops_get_pipeline_run: azureDevOpsGetPipelineRunTool,
  azure_devops_query_work_items: azureDevOpsQueryWorkItemsTool,
  azure_devops_get_work_item: azureDevOpsGetWorkItemTool,
  azure_devops_create_work_item: azureDevOpsCreateWorkItemTool,
  azure_devops_update_work_item: azureDevOpsUpdateWorkItemTool,
  box_upload_file: boxUploadFileTool,
  box_download_file: boxDownloadFileTool,
  box_list_folder: boxListFolderTool,
  box_create_folder: boxCreateFolderTool,
  box_delete_file: boxDeleteFileTool,
  box_get_file_info: boxGetFileInfoTool,
  box_create_shared_link: boxCreateSharedLinkTool,
  brandfetch_get_brand: brandfetchGetBrandTool,
  brandfetch_search: brandfetchSearchTool,
  brightdata_scrape_url: brightDataScrapeUrlTool,
  brightdata_serp_search: brightDataSerpSearchTool,
  brightdata_discover: brightDataDiscoverTool,
  calcom_list_bookings: calcomListBookingsTool,
  calcom_create_booking: calcomCreateBookingTool,
  calcom_get_booking: calcomGetBookingTool,
  calcom_cancel_booking: calcomCancelBookingTool,
  calcom_get_slots: calcomGetSlotsTool,
  calcom_list_event_types: calcomListEventTypesTool,
  calendly_get_current_user: calendlyGetCurrentUserTool,
  calendly_list_event_types: calendlyListEventTypesTool,
  calendly_get_event_type: calendlyGetEventTypeTool,
  calendly_list_scheduled_events: calendlyListScheduledEventsTool,
  calendly_get_scheduled_event: calendlyGetScheduledEventTool,
  calendly_list_event_invitees: calendlyListEventInviteesTool,
  calendly_cancel_event: calendlyCancelEventTool,
  clerk_list_users: clerkListUsersTool,
  clerk_get_user: clerkGetUserTool,
  clerk_create_user: clerkCreateUserTool,
  clerk_update_user: clerkUpdateUserTool,
  clerk_delete_user: clerkDeleteUserTool,
  clerk_list_organizations: clerkListOrganizationsTool,
  clerk_get_organization: clerkGetOrganizationTool,
  clerk_create_organization: clerkCreateOrganizationTool,
  clerk_list_sessions: clerkListSessionsTool,
  clerk_revoke_session: clerkRevokeSessionTool,
  cloudflare_list_zones: cloudflareListZonesTool,
  cloudflare_get_zone: cloudflareGetZoneTool,
  cloudflare_list_dns_records: cloudflareListDnsRecordsTool,
  cloudflare_create_dns_record: cloudflareCreateDnsRecordTool,
  cloudflare_update_dns_record: cloudflareUpdateDnsRecordTool,
  cloudflare_delete_dns_record: cloudflareDeleteDnsRecordTool,
  cloudflare_purge_cache: cloudflarePurgeCacheTool,
  cloudformation_describe_stacks: cloudformationDescribeStacksTool,
  cloudformation_list_stack_resources: cloudformationListStackResourcesTool,
  cloudformation_describe_stack_events: cloudformationDescribeStackEventsTool,
  cloudformation_detect_stack_drift: cloudformationDetectStackDriftTool,
  cloudformation_get_template: cloudformationGetTemplateTool,
  cloudformation_validate_template: cloudformationValidateTemplateTool,
  cloudwatch_query_logs: cloudwatchQueryLogsTool,
  cloudwatch_describe_log_groups: cloudwatchDescribeLogGroupsTool,
  cloudwatch_get_log_events: cloudwatchGetLogEventsTool,
  cloudwatch_list_metrics: cloudwatchListMetricsTool,
  cloudwatch_get_metric_statistics: cloudwatchGetMetricStatisticsTool,
  cloudwatch_put_metric_data: cloudwatchPutMetricDataTool,
  cloudwatch_describe_alarms: cloudwatchDescribeAlarmsTool,
  crowdstrike_query_sensors: crowdstrikeQuerySensorsTool,
  crowdstrike_get_sensor_details: crowdstrikeGetSensorDetailsTool,
  crowdstrike_get_sensor_aggregates: crowdstrikeGetSensorAggregatesTool,
  cursor_launch_agent: cursorLaunchAgentTool,
  cursor_add_followup: cursorAddFollowupTool,
  cursor_get_agent: cursorGetAgentTool,
  cursor_get_conversation: cursorGetConversationTool,
  cursor_list_agents: cursorListAgentsTool,
  cursor_stop_agent: cursorStopAgentTool,
  dagster_launch_run: dagsterLaunchRunTool,
  dagster_get_run: dagsterGetRunTool,
  dagster_get_run_logs: dagsterGetRunLogsTool,
  dagster_list_runs: dagsterListRunsTool,
  dagster_terminate_run: dagsterTerminateRunTool,
  dagster_list_jobs: dagsterListJobsTool,
  dagster_list_schedules: dagsterListSchedulesTool,
  databricks_execute_sql: databricksExecuteSqlTool,
  databricks_list_clusters: databricksListClustersTool,
  databricks_list_jobs: databricksListJobsTool,
  databricks_run_job: databricksRunJobTool,
  databricks_get_run_status: databricksGetRunStatusTool,
  databricks_list_catalogs: databricksListCatalogsTool,
  datadog_query_metrics: datadogQueryMetricsTool,
  datadog_query_logs: datadogQueryLogsTool,
  datadog_list_monitors: datadogListMonitorsTool,
  datadog_create_incident: datadogCreateIncidentTool,
  datadog_list_incidents: datadogListIncidentsTool,
  datadog_list_dashboards: datadogListDashboardsTool,
  devin_create_session: devinCreateSessionTool,
  devin_get_session: devinGetSessionTool,
  devin_list_sessions: devinListSessionsTool,
  devin_send_message: devinSendMessageTool,
  devin_add_secret: devinAddSecretTool,
  devin_delete_secret: devinDeleteSecretTool,
  devin_get_snapshot: devinGetSnapshotTool,
  docusign_create_envelope: docusignCreateEnvelopeTool,
  docusign_get_envelope: docusignGetEnvelopeTool,
  docusign_list_envelopes: docusignListEnvelopesTool,
  docusign_send_envelope: docusignSendEnvelopeTool,
  docusign_get_signing_url: docusignGetSigningUrlTool,
  docusign_void_envelope: docusignVoidEnvelopeTool,
  dropbox_upload_file: dropboxUploadFileTool,
  dropbox_download_file: dropboxDownloadFileTool,
  dropbox_list_folder: dropboxListFolderTool,
  dropbox_create_folder: dropboxCreateFolderTool,
  dropbox_delete_file: dropboxDeleteFileTool,
  dropbox_get_file_metadata: dropboxGetFileMetadataTool,
  dropbox_create_shared_link: dropboxCreateSharedLinkTool,
  dropbox_search_files: dropboxSearchFilesTool,
  dspy_run: dspyRunTool,
  dub_create_link: dubCreateLinkTool,
  dub_get_link: dubGetLinkTool,
  dub_update_link: dubUpdateLinkTool,
  dub_delete_link: dubDeleteLinkTool,
  dub_list_links: dubListLinksTool,
  dub_get_analytics: dubGetAnalyticsTool,
  duckduckgo_text_search: duckduckgoTextSearchTool,
  duckduckgo_news_search: duckduckgoNewsSearchTool,
  duckduckgo_images_search: duckduckgoImagesSearchTool,
  dynamodb_get_item: dynamodbGetItemTool,
  dynamodb_put_item: dynamodbPutItemTool,
  dynamodb_update_item: dynamodbUpdateItemTool,
  dynamodb_delete_item: dynamodbDeleteItemTool,
  dynamodb_query: dynamodbQueryTool,
  dynamodb_scan: dynamodbScanTool,
  dynamodb_batch_write: dynamodbBatchWriteTool,
  elasticsearch_search: elasticsearchSearchTool,
  elasticsearch_index: elasticsearchIndexTool,
  elasticsearch_get: elasticsearchGetTool,
  elasticsearch_delete: elasticsearchDeleteTool,
  elasticsearch_bulk: elasticsearchBulkTool,
  elasticsearch_list_indices: elasticsearchListIndicesTool,
  emailbison_find_email: emailbisonFindEmailTool,
  emailbison_verify_email: emailbisonVerifyEmailTool,
  emailbison_bulk_find: emailbisonBulkFindTool,
  emailbison_domain_search: emailbisonDomainSearchTool,
  enrich_email_to_profile: enrichEmailToProfileTool,
  enrich_find_email: enrichFindEmailTool,
  enrich_verify_email: enrichVerifyEmailTool,
  enrich_company_lookup: enrichCompanyLookupTool,
  enrich_search_people: enrichSearchPeopleTool,
  enrich_phone_finder: enrichPhoneFinderTool,
  evernote_create_note: evernoteCreateNoteTool,
  evernote_get_note: evernoteGetNoteTool,
  evernote_update_note: evernoteUpdateNoteTool,
  evernote_delete_note: evernoteDeleteNoteTool,
  evernote_search_notes: evernoteSearchNotesTool,
  evernote_list_notebooks: evernoteListNotebooksTool,
  fathom_list_meetings: fathomListMeetingsTool,
  fathom_get_summary: fathomGetSummaryTool,
  fathom_get_transcript: fathomGetTranscriptTool,
  fathom_list_team_members: fathomListTeamMembersTool,
  fathom_list_teams: fathomListTeamsTool,
  // Gamma tools
  gamma_generate: gammaGenerateTool,
  gamma_generate_from_template: gammaGenerateFromTemplateTool,
  gamma_check_status: gammaCheckStatusTool,
  gamma_list_themes: gammaListThemesTool,
  gamma_list_folders: gammaListFoldersTool,
  // Grain tools
  grain_list_recordings: grainListRecordingsTool,
  grain_get_recording: grainGetRecordingTool,
  grain_get_transcript: grainGetTranscriptTool,
  grain_list_views: grainListViewsTool,
  grain_list_teams: grainListTeamsTool,
  grain_list_meeting_types: grainListMeetingTypesTool,
  grain_create_hook: grainCreateHookTool,
  grain_list_hooks: grainListHooksTool,
  grain_delete_hook: grainDeleteHookTool,
  // Granola tools
  granola_list_notes: granolaListNotesTool,
  granola_get_note: granolaGetNoteTool,
  // Hex tools
  hex_cancel_run: hexCancelRunTool,
  hex_create_collection: hexCreateCollectionTool,
  hex_get_collection: hexGetCollectionTool,
  hex_get_data_connection: hexGetDataConnectionTool,
  hex_get_group: hexGetGroupTool,
  hex_get_project: hexGetProjectTool,
  hex_get_project_runs: hexGetProjectRunsTool,
  hex_get_queried_tables: hexGetQueriedTablesTool,
  hex_get_run_status: hexGetRunStatusTool,
  hex_list_collections: hexListCollectionsTool,
  hex_list_data_connections: hexListDataConnectionsTool,
  hex_list_groups: hexListGroupsTool,
  hex_list_projects: hexListProjectsTool,
  hex_list_users: hexListUsersTool,
  hex_run_project: hexRunProjectTool,
  hex_update_project: hexUpdateProjectTool,
  // Kalshi tools
  kalshi_get_markets: kalshiGetMarketsTool,
  kalshi_get_market: kalshiGetMarketTool,
  kalshi_get_events: kalshiGetEventsTool,
  kalshi_get_event: kalshiGetEventTool,
  kalshi_get_orderbook: kalshiGetOrderbookTool,
  kalshi_get_trades: kalshiGetTradesTool,
  kalshi_get_candlesticks: kalshiGetCandlesticksTool,
  kalshi_get_series_by_ticker: kalshiGetSeriesByTickerTool,
  kalshi_get_exchange_status: kalshiGetExchangeStatusTool,
  kalshi_get_balance: kalshiGetBalanceTool,
  kalshi_get_positions: kalshiGetPositionsTool,
  kalshi_get_orders: kalshiGetOrdersTool,
  kalshi_get_order: kalshiGetOrderTool,
  kalshi_get_fills: kalshiGetFillsTool,
  kalshi_create_order: kalshiCreateOrderTool,
  kalshi_cancel_order: kalshiCancelOrderTool,
  kalshi_amend_order: kalshiAmendOrderTool,
  // Logs tools
  logs_query: logsQueryTool,
  logs_get: logsGetTool,
  logs_get_execution: logsGetExecutionTool,
  // Luma (events) tools
  luma_get_event: lumaGetEventTool,
  luma_create_event: lumaCreateEventTool,
  luma_update_event: lumaUpdateEventTool,
  luma_list_events: lumaListEventsTool,
  luma_get_guests: lumaGetGuestsTool,
  luma_add_guests: lumaAddGuestsTool,
  // Polymarket tools
  polymarket_get_markets: polymarketGetMarketsTool,
  polymarket_get_market: polymarketGetMarketTool,
  polymarket_get_events: polymarketGetEventsTool,
  polymarket_get_event: polymarketGetEventTool,
  polymarket_get_series: polymarketGetSeriesTool,
  polymarket_get_series_by_id: polymarketGetSeriesByIdTool,
  polymarket_get_tags: polymarketGetTagsTool,
  polymarket_search: polymarketSearchTool,
  polymarket_get_orderbook: polymarketGetOrderbookTool,
  polymarket_get_price: polymarketGetPriceTool,
  polymarket_get_midpoint: polymarketGetMidpointTool,
  polymarket_get_spread: polymarketGetSpreadTool,
  polymarket_get_tick_size: polymarketGetTickSizeTool,
  polymarket_get_last_trade_price: polymarketGetLastTradePriceTool,
  polymarket_get_price_history: polymarketGetPriceHistoryTool,
  polymarket_get_positions: polymarketGetPositionsTool,
  polymarket_get_trades: polymarketGetTradesTool,
  polymarket_get_activity: polymarketGetActivityTool,
  polymarket_get_leaderboard: polymarketGetLeaderboardTool,
  polymarket_get_holders: polymarketGetHoldersTool,
  // Profound tools
  profound_list_categories: profoundListCategoriesTool,
  profound_list_assets: profoundListAssetsTool,
  profound_list_domains: profoundListDomainsTool,
  profound_list_models: profoundListModelsTool,
  profound_list_personas: profoundListPersonasTool,
  profound_list_regions: profoundListRegionsTool,
  profound_category_assets: profoundCategoryAssetsTool,
  profound_category_personas: profoundCategoryPersonasTool,
  profound_category_prompts: profoundCategoryPromptsTool,
  profound_category_tags: profoundCategoryTagsTool,
  profound_category_topics: profoundCategoryTopicsTool,
  profound_list_optimizations: profoundListOptimizationsTool,
  profound_optimization_analysis: profoundOptimizationAnalysisTool,
  profound_citation_prompts: profoundCitationPromptsTool,
  profound_visibility_report: profoundVisibilityReportTool,
  profound_citations_report: profoundCitationsReportTool,
  profound_sentiment_report: profoundSentimentReportTool,
  profound_query_fanouts: profoundQueryFanoutsTool,
  profound_prompt_answers: profoundPromptAnswersTool,
  profound_prompt_volume: profoundPromptVolumeTool,
  profound_bots_report: profoundBotsReportTool,
  profound_referrals_report: profoundReferralsReportTool,
  profound_bot_logs: profoundBotLogsTool,
  profound_raw_logs: profoundRawLogsTool,
  // Pulse tools
  pulse_parser: pulseParserTool,
  // Quiver tools
  quiver_text_to_svg: quiverTextToSvgTool,
  quiver_image_to_svg: quiverImageToSvgTool,
  quiver_list_models: quiverListModelsTool,
  // Search tool
  search_tool: zelaxySearchTool,
  // Sixtyfour tools
  sixtyfour_find_phone: sixtyfourFindPhoneTool,
  sixtyfour_find_email: sixtyfourFindEmailTool,
  sixtyfour_enrich_lead: sixtyfourEnrichLeadTool,
  sixtyfour_enrich_company: sixtyfourEnrichCompanyTool,
  // Video generator tools
  runway_generate_video: runwayGenerateVideoTool,
  luma_generate_video: lumaGenerateVideoTool,
  minimax_generate_video: minimaxGenerateVideoTool,
  falai_generate_video: falaiGenerateVideoTool,
  veo_generate_video: veoGenerateVideoTool,
  // Provider chat tools
  // Provider chat tools - handled separately in agent blocks
}
