// Export the main client and types

export type { ZelaxyAgentRequest, ZelaxyAgentResponse } from './client'
export { ZelaxyAgentClient, zelaxyAgentClient } from './client'

// Import for default export
import { zelaxyAgentClient } from './client'

// Re-export for convenience
export default zelaxyAgentClient
