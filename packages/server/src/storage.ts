import { greatCircleDistance, gridDisk, latLngToCell, UNITS } from 'h3-js'

const CELL_LEVEL = 8

type Candidate = {
  peerId: string
  lat: number
  lng: number
  code: string
  updatedAt: number
}

const storageMap = new Map<string, Candidate[]>()

// 每10秒清理一次过期的候选，过期时间定为5分钟
setTimeout(() => {
  for (const [cell, candidates] of storageMap.entries()) {
    const now = Date.now()
    // 保留5分钟内的候选
    const available = candidates.filter(item => now - item.updatedAt < 5 * 60 * 1000)
    if (available.length > 0) {
      storageMap.set(cell, available)
    } else {
      storageMap.delete(cell)
    }
  }
}, 10 * 1000);

export const storage = {
  addCandidate: (candidate: Omit<Candidate, 'updatedAt'>) => {
    const cell = latLngToCell(candidate.lat, candidate.lng, CELL_LEVEL)
    const value: Candidate = { ...candidate, updatedAt: Date.now() }
    const exists = (storageMap.get(cell) || [] as Candidate[]).filter(item => item.peerId !== value.peerId)
    exists.push(value)
    storageMap.set(cell, exists)
  },
  queryCandidates: (query: { lat: number, lng: number, code: string }): (Candidate & { distance: number })[] => {
    const cell = latLngToCell(query.lat, query.lng, CELL_LEVEL)
    const ring = gridDisk(cell, 1)
    const candidates = ring.map(cell => storageMap.get(cell) || []).flat();
    const results: (Candidate & { distance: number })[] = []
    for (const candidate of candidates) {
      if (candidate.code === query.code) {
        const distance = greatCircleDistance([query.lat, query.lng], [candidate.lat, candidate.lng], UNITS.m)
        results.push({ ...candidate, distance })
      }
    }
    return results
  }
}