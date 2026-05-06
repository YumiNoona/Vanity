const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export const getProxyUrl = (url: string) => {
  return `${API_BASE}/proxy?url=${encodeURIComponent(url)}`
}

export const proxyFetch = async (url: string, options: RequestInit = {}) => {
  const proxyUrl = getProxyUrl(url)
  return fetch(proxyUrl, options)
}
