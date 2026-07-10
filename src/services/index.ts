export const lookup = async (options: { peerId: string, code: string, lat: number, lng: number }): Promise<string> => {
  const url = new URL('http://localhost:3001/api/v1/lookup')
  url.searchParams.set('peerId', options.peerId)
  url.searchParams.set('code', options.code)
  url.searchParams.set('lat', options.lat.toString())
  url.searchParams.set('lng', options.lng.toString())
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Failed to lookup: ${response.statusText}`)
  }
  const data = await response.json()
  return data.peerId
}