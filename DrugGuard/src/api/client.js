const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://drugguardbackend.onrender.com'

export async function apiRequest(path, options = {}) {
  const { headers = {}, ...restOptions } = options
  const isFormData = options.body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: isFormData
      ? { ...headers }
      : {
          'Content-Type': 'application/json',
          ...headers
        }
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}
