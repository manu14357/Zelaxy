import { createCustomerTool } from '@/tools/square/create_customer'
import { getPaymentTool } from '@/tools/square/get_payment'
import { listCustomersTool } from '@/tools/square/list_customers'
import { listPaymentsTool } from '@/tools/square/list_payments'

export const squareListCustomersTool = listCustomersTool
export const squareCreateCustomerTool = createCustomerTool
export const squareListPaymentsTool = listPaymentsTool
export const squareGetPaymentTool = getPaymentTool
