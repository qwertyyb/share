import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { storage } from './storage'

const app = new Hono()
app.get('/', (c) => c.text('Hello Node.js!'))

app.use('/api/v1/*', cors({
  origin: '*'
}))

app.get('/api/v1/lookup', async (c) => {
  const { peerId, code } = c.req.query()
  const lat = Number(c.req.query('lat'))
  const lng = Number(c.req.query('lng'))
  if (!peerId || isNaN(lat) || isNaN(lng) || !code || code.length < 3) {
    return c.json({ error: 'Missing required parameters' }, 400)
  }

  // 查询位置周围且token匹配的候选
 let candidates = await storage.queryCandidates({ lat, lng, code })
  // 首先排除掉当前节点
  candidates = candidates.filter((candidate) => candidate.peerId !== peerId)
  storage.addCandidate({ peerId, lat, lng, code })
  if (candidates.length === 0) {
    return c.json({ code: 404, error: 'No candidates found' })
  }
  // 如果只有一个节点，则直接返回该节点
  if (candidates.length === 1) {
    return c.json({ code: 200, data: { peerId: candidates[0].peerId } })
  }
  // 如果有多于一个节点，则返回最近的节点
  const bestCandidate = candidates.sort((a, b) => a.distance - b.distance)[0]
  return c.json({ code: 200, data: { peerId: bestCandidate.peerId } })

})

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`Server is running on ${info.port}`)
})