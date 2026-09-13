import { apiRequest } from '../client'

export async function loginRetailer(username, password) {
  const response = await apiRequest('/auth/custom-login', {
    method: 'POST',
    body: JSON.stringify({ role: 'retailer', username, password })
  })

  localStorage.setItem('dg_user', JSON.stringify({ role: 'retailer', ...response.user }))
  return response
}

export async function getRetailerPurchases(retailerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/purchases`)
}

export async function getRetailerSalesHistory(retailerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/sales-history`)
}

export async function getRetailerProfile(retailerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/profile`)
}

export async function getRetailerWholesalers(retailerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/wholesalers`)
}

export async function getRetailerWholesalerCatalog(retailerId, wholesalerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/wholesalers/${encodeURIComponent(wholesalerId)}/catalog`)
}

export async function getRetailerSellCatalog(retailerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/sell-catalog`)
}

export async function getRetailerPendingStock(retailerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/pending-stock`)
}

export async function followUpRetailerPendingStock(retailerId, orderId, medicineId, note = '') {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/pending-stock/${encodeURIComponent(orderId)}/follow-up`, {
    method: 'POST',
    body: JSON.stringify({ medicineId, note })
  })
}

export async function markRetailerPendingStockReceived(retailerId, orderId, medicineId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/pending-stock/${encodeURIComponent(orderId)}/mark-received`, {
    method: 'POST',
    body: JSON.stringify({ medicineId })
  })
}

export async function createRetailerCustomerSale(payload) {
  return apiRequest('/retailer/sales', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function getRetailerReturnProductBills(retailerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/return-product-bills`)
}

export async function createRetailerReturnRequest(retailerId, payload) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/return-requests`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function createRetailerOrder(payload) {
  return apiRequest('/retailer/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function getRetailerApproveStockBills(retailerId) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/approve-stock`)
}

export async function approveRetailerStock(retailerId, orderId, acceptedMedicineIds) {
  return apiRequest(`/retailer/${encodeURIComponent(retailerId)}/approve-stock/${encodeURIComponent(orderId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ acceptedMedicineIds })
  })
}
