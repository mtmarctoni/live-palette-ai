const { createServer } = require("http")
const { Server } = require("socket.io")
const next = require("next")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = process.env.PORT || 3000
const socketPort = 3001

// Create Next.js app
const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

// Store collaboration state
const collaborationState = {
  users: new Map(),
  currentPalette: null,
}

app.prepare().then(() => {
  // Create HTTP server for Socket.io
  const httpServer = createServer()
  const io = new Server(httpServer, {
    cors: {
      origin: `http://localhost:${port}`,
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    const { userId, email } = socket.handshake.query

    console.log(`User ${email} connected`)

    // Add user to collaboration state
    collaborationState.users.set(socket.id, {
      id: userId,
      email,
      socketId: socket.id,
    })

    // Send current state to new user
    socket.emit("collaboration-state", {
      users: Array.from(collaborationState.users.values()),
      currentPalette: collaborationState.currentPalette,
    })

    // Broadcast user joined to others
    socket.broadcast.emit("user-joined", {
      id: userId,
      email,
      socketId: socket.id,
    })

    // Handle cursor movement
    socket.on("cursor-move", (data) => {
      const user = collaborationState.users.get(socket.id)
      if (user) {
        user.cursor = data.cursor
        socket.broadcast.emit("cursor-update", {
          userId: user.id,
          email: user.email,
          cursor: data.cursor,
        })
      }
    })

    // Handle color selection
    socket.on("color-select", (data) => {
      const user = collaborationState.users.get(socket.id)
      if (user) {
        user.selectedColor = data.color
        socket.broadcast.emit("color-selected", {
          userId: user.id,
          email: user.email,
          color: data.color,
        })
      }
    })

    // Handle palette updates
    socket.on("palette-update", (data) => {
      collaborationState.currentPalette = data.palette
      socket.broadcast.emit("palette-updated", {
        palette: data.palette,
        updatedBy: {
          id: userId,
          email,
        },
      })
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${email} disconnected`)
      collaborationState.users.delete(socket.id)

      socket.broadcast.emit("user-left", {
        userId,
        email,
      })
    })
  })

  // Start Socket.io server
  httpServer.listen(socketPort, () => {
    console.log(`Socket.io server running on port ${socketPort}`)
  })

  // Start Next.js server
  const server = createServer(async (req, res) => {
    await handler(req, res)
  })

  server.listen(port, () => {
    console.log(`Next.js server running on http://localhost:${port}`)
  })
})
