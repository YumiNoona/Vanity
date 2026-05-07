const API_BASE = import.meta.env.VITE_API_URL || ""

export const getProxyUrl = (url: string) => {
  return `${API_BASE}/api/proxy?url=${encodeURIComponent(url)}`
}

export const proxyFetch = async (url: string, options: RequestInit = {}) => {
  const proxyUrl = getProxyUrl(url)
  return fetch(proxyUrl, options)
}
