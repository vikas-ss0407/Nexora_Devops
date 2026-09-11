import { apiRequest } from '../client'

export async function getInspectorWholesalerSales(district) {
  return apiRequest(`/api/inspector/wholesaler-sales?district=${encodeURIComponent(district)}`)
}