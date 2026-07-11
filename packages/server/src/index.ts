import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { storage } from './storage'

const app = new Hono()

app.use('/api/v1/*', cors({
  origin: '*'
}))

app.get('/api/v1/health', (c) => c.json({ code: 200, data: { message: 'OK' } }))

app.get('/api/v1/lookup', async (c) => {
  const { peerId, code } = c.req.query()
  const lat = Number(c.req.query('lat'))
  const lng = Number(c.req.query('lng'))
  if (!peerId || isNaN(lat) || isNaN(lng) || !code || code.length < 3) {
    return c.json({ error: 'Missing required parameters' }, 400)
  }

  // 查询位置周围且token匹配的候选
 let candidates = await storage.queryCandidates({ lat, lng, code })
  // 排除掉当前节点
  candidates = candidates.filter((candidate) => candidate.peerId !== peerId)

  storage.addCandidate({ peerId, lat, lng, code })
  return c.json({ code: 200, data: { peers: candidates.map(item => ({ peerId: item.peerId, updatedAt: item.updatedAt })) } })
})

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Server is running on ${info.port}`)
})