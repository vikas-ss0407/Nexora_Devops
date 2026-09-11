import { apiRequest } from '../client'

export async function getInspectorRetailerPurchases(district) {
  return apiRequest(`/api/inspector/retailer-purchases?district=${encodeURIComponent(district)}`)
}