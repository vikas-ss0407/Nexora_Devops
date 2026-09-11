import { apiRequest } from '../client'

export async function loginWholesaler(username, password) {
  const response = await apiRequest('/api/auth/custom-login', {
    method: 'POST',
    body: JSON.stringify({ role: 'wholesaler', username, password })
  })

  localStorage.setItem('dg_user', JSON.stringify({ role: 'wholesaler', ...response.user }))
  return response
}

export async function createWholesalerSale(payload) {
  return apiRequest('/api/wholesaler/sales', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function getWholesalerSellCatalog(wholesalerId) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/sell-catalog`)
}

export async function getWholesalerSalesHistory(wholesalerId) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/sales-history`)
}

export async function getWholesalerStock(wholesalerId) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/stock`)
}

export async function getManufacturerMedicines(manufacturer) {
  const query = manufacturer
    ? `?manufacturer=${encodeURIComponent(manufacturer)}`
    : ''

  return apiRequest(`/api/wholesaler/manufacturer-medicines${query}`)
}

export async function createWholesalerManufacturerPurchase(payload) {
  return apiRequest('/api/wholesaler/manufacturer-purchases', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function getWholesalerApproveStockBills(wholesalerId) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/approve-stock`)
}

export async function approveWholesalerStock(wholesalerId, purchaseId, acceptedMedicineIds) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/approve-stock/${encodeURIComponent(purchaseId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ acceptedMedicineIds })
  })
}

export async function getWholesalerReturnRequests(wholesalerId) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/return-requests`)
}

export async function createWholesalerReturnRequest(wholesalerId, payload) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/return-requests`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateReturnRequestStatus(wholesalerId, requestId, status, refundAmount) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/return-requests/${encodeURIComponent(requestId)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, refundAmount })
  })
}

export async function getWholesalerProfile(wholesalerId) {
  return apiRequest(`/api/wholesaler/${encodeURIComponent(wholesalerId)}/profile`)
}
