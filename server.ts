import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const port = parseInt(process.env.PORT ?? '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
      methods: ['GET', 'POST'],
    },
  })

  // Optional Redis adapter for horizontal scaling
  if (process.env.REDIS_URL) {
    try {
      const { createAdapter } = await import('@socket.io/redis-adapter')
      const { default: Redis } = await import('ioredis')
      const pubClient = new Redis(process.env.REDIS_URL)
      const subClient = pubClient.duplicate()
      io.adapter(createAdapter(pubClient, subClient))
      console.log('[Socket.io] Using Redis adapter')
    } catch (err) {
      console.warn('[Socket.io] Redis adapter unavailable, using in-memory adapter', err)
    }
  }

  // Make io accessible from API routes running in the same process
  global.io = io

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    socket.on('join:show', (showId: string) => {
      socket.join(`show_${showId}`)
      console.log(`[Socket.io] ${socket.id} joined show_${showId}`)
    })

    socket.on('leave:show', (showId: string) => {
      socket.leave(`show_${showId}`)
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
