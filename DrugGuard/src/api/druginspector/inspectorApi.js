import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase/config/firebaseClient'
import { apiRequest } from '../client'

function mapInspectorAuthError(error) {
  const code = String(error?.code || '')

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid inspector email or password.'
  }

  if (code === 'auth/invalid-email') {
    return 'Enter a valid inspector email address.'
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please wait a moment and try again.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Email/password login is disabled in Firebase Authentication for this project.'
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error while contacting Firebase. Check your connection and try again.'
  }

  return error?.message || 'Inspector login failed. Please try again.'
}

export async function loginInspector(email, password) {
  let result
  try {
    result = await signInWithEmailAndPassword(auth, email, password)
  } catch (error) {
    throw new Error(mapInspectorAuthError(error))
  }

  const user = result.user
  const profile = await apiRequest(`/api/inspector/profile?email=${encodeURIComponent(user.email || '')}`)

  const session = {
    role: 'inspector',
    uid: user.uid,
    email: user.email,
    district: profile.district || ''
  }

  localStorage.setItem('dg_user', JSON.stringify(session))
  return session
}

export async function createLicenseByInspector(payload) {
  return apiRequest('/api/inspector/licenses', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function getInspectorVisibleRetailers(district) {
  return apiRequest(`/api/inspector/districts/${encodeURIComponent(district)}/retailers-visible`)
}

export async function getInspectorShops(district) {
  return apiRequest(`/api/inspector/shops?district=${encodeURIComponent(district)}`)
}

export async function getInspectorDashboardSummary(district) {
  return apiRequest(`/api/inspector/dashboard-summary?district=${encodeURIComponent(district)}`)
}
