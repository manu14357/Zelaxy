import { createProductTool } from '@/tools/shopify/create_product'
import { getOrderTool } from '@/tools/shopify/get_order'
import { listOrdersTool } from '@/tools/shopify/list_orders'
import { listProductsTool } from '@/tools/shopify/list_products'

export const shopifyListProductsTool = listProductsTool
export const shopifyCreateProductTool = createProductTool
export const shopifyListOrdersTool = listOrdersTool
export const shopifyGetOrderTool = getOrderTool
