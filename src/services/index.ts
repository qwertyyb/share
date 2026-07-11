const BASE_URL = import.meta.env.DEV ? 'http://localhost:3001/api/v1' : 'https://share.qwertyyb.cn/api/v1'

export const lookup = async (options: { peerId: string, code: string, lat: number, lng: number }): Promise<{ peerId: string, updatedAt: number }[]> => {
  const url = new URL(`${BASE_URL}/lookup`)
  url.searchParams.set('peerId', options.peerId)
  url.searchParams.set('code', options.code)
  url.searchParams.set('lat', options.lat.toString())
  url.searchParams.set('lng', options.lng.toString())
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Failed to lookup: ${response.statusText}`)
  }
  const data: { code: number, data: { peers: { peerId: string, updatedAt: number }[] }, error?: string } = await response.json()
  if (data.code !== 200) {
    throw new Error(data.error ?? 'Failed to lookup')
  }
  return data.data.peers
}

export const checkHealth = async () => {
  try {
    const url = new URL(`${BASE_URL}/health`)
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to check health: ${response.statusText}`)
    }
    const data: { code: number, data: { message: string }, error?: string } = await response.json()
    if (data.code !== 200) {
      throw new Error(data.error ?? 'Failed to check health')
    }
    return true
  } catch (err) {
    console.error('Failed to check health', err)
    return false
  }
}