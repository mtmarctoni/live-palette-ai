import { io, type Socket } from "socket.io-client"

export interface User {
  id: string
  email: string
  cursor?: { x: number; y: number }
  selectedColor?: string
}

export interface CollaborationState {
  users: Record<string, User>
  currentPalette?: {
    colors: string[]
    keyword: string
    source: "ai" | "fallback"
  }
}

class SocketManager {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect(userId: string, email: string) {
    if (this.socket?.connected) return this.socket

    this.socket = io(process.env.NODE_ENV === "production" ? "" : "http://localhost:3001", {
      query: { userId, email },
    })

    // Re-attach all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback)
      })
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data)
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)

    if (this.socket) {
      this.socket.on(event, callback as any)
    }
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }

    if (this.socket) {
      this.socket.off(event, callback as any)
    }
  }

  get connected() {
    return this.socket?.connected || false
  }
}

export const socketManager = new SocketManager()
