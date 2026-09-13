import { apiRequest } from '../client'

export async function getInspectorRetailerPurchases(district) {
  return apiRequest(`/inspector/retailer-purchases?district=${encodeURIComponent(district)}`)
}