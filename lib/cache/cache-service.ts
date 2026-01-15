"use client"

interface CacheConfig {
  ttl?: number // Time to live em segundos
  maxSize?: number // Tamanho máximo do cache
  strategy?: "lru" | "fifo" // Estratégia de remoção
}

interface CacheItem<T> {
  data: T
  timestamp: number
  accessCount: number
  lastAccessed: number
}

export class CacheService {
  private static instances: Map<string, CacheService> = new Map()
  private cache: Map<string, CacheItem<any>> = new Map()
  private config: Required<CacheConfig>

  private constructor(name: string, config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 300, // 5 minutos padrão
      maxSize: config.maxSize || 100,
      strategy: config.strategy || "lru",
    }

    // Limpeza periódica
    setInterval(() => {
      this.cleanup()
    }, 60000) // A cada minuto
  }

  static getInstance(name: string, config?: CacheConfig): CacheService {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CacheService(name, config))
    }
    return this.instances.get(name)!
  }

  set<T>(key: string, data: T): void {
    const now = Date.now()

    // Verificar se precisa remover itens antigos
    if (this.cache.size >= this.config.maxSize) {
      this.evict()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    const now = Date.now()
    const age = (now - item.timestamp) / 1000

    // Verificar se expirou
    if (age > this.config.ttl) {
      this.cache.delete(key)
      return null
    }

    // Atualizar estatísticas de acesso
    item.accessCount++
    item.lastAccessed = now

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Buscar com fallback
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    try {
      const data = await fetcher()
      this.set(key, data)
      return data
    } catch (error) {
      console.error(`❌ Erro ao buscar dados para cache key "${key}":`, error)
      throw error
    }
  }

  // Invalidar por padrão
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern)
    let count = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  // Limpeza de itens expirados
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      const age = (now - item.timestamp) / 1000

      if (age > this.config.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} itens removidos`)
    }
  }

  // Remoção de itens quando cache está cheio
  private evict(): void {
    if (this.cache.size === 0) return

    let keyToRemove: string

    if (this.config.strategy === "lru") {
      // Least Recently Used
      let oldestTime = Date.now()
      keyToRemove = ""

      for (const [key, item] of this.cache.entries()) {
        if (item.lastAccessed < oldestTime) {
          oldestTime = item.lastAccessed
          keyToRemove = key
        }
      }
    } else {
      // FIFO - First In, First Out
      let oldestTime = Date.now()
      keyToRemove = ""

      for (const [key, item] of this.cache.entries()) {
        if (item.timestamp < oldestTime) {
          oldestTime = item.timestamp
          keyToRemove = key
        }
      }
    }

    if (keyToRemove) {
      this.cache.delete(keyToRemove)
      console.log(`🗑️ Cache eviction: removido "${keyToRemove}"`)
    }
  }

  // Estatísticas do cache
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    oldestItem: number
    newestItem: number
  } {
    let totalAccess = 0
    let oldestTime = Date.now()
    let newestTime = 0

    for (const item of this.cache.values()) {
      totalAccess += item.accessCount
      oldestTime = Math.min(oldestTime, item.timestamp)
      newestTime = Math.max(newestTime, item.timestamp)
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalAccess / Math.max(this.cache.size, 1),
      oldestItem: oldestTime,
      newestItem: newestTime,
    }
  }
}

// Instâncias pré-configuradas
export const apiCache = CacheService.getInstance("api", {
  ttl: 300, // 5 minutos
  maxSize: 200,
  strategy: "lru",
})

export const userCache = CacheService.getInstance("user", {
  ttl: 600, // 10 minutos
  maxSize: 50,
  strategy: "lru",
})

export const staticCache = CacheService.getInstance("static", {
  ttl: 3600, // 1 hora
  maxSize: 500,
  strategy: "fifo",
})

export const realtimeCache = CacheService.getInstance("realtime", {
  ttl: 60, // 1 minuto
  maxSize: 100,
  strategy: "lru",
})
