/**
 * Billing and cost constants shared between client and server code
 */

/**
 * Default free credits (in dollars) for new users
 */
export const DEFAULT_FREE_CREDITS = 10

/**
 * Base charge applied to every workflow execution, in USD. Applied regardless of whether the
 * workflow uses AI models. Per the billing docs this is 1 credit = $0.005 per run
 * (1 credit = $0.005; see DOLLARS_PER_CREDIT in providers/models).
 */
export const BASE_EXECUTION_CHARGE = 0.005
