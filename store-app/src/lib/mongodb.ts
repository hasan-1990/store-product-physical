import { MongoClient, Db, Collection } from 'mongodb'

function normalizeMongoUri(uri: string): string {
  if (!uri || uri.includes('replicaSet=') || uri.startsWith('mongodb+srv://')) {
    return uri
  }

  const isLocal =
    uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('mongodb:')
  if (isLocal) return uri

  const match = uri.match(
    /^mongodb:\/\/([^@]+)@([a-z0-9-]+-shard-00-)\d{2}\.([^/:]+)(?::\d+)?\/([^?]+)(\?.*)?$/i
  )
  if (!match) return uri

  const [, credentials, shardPrefix, hostSuffix, database] = match
  const replicaSet = process.env.MONGODB_REPLICA_SET || 'atlas-zbx78g-shard-0'
  const hosts = ['00', '01', '02']
    .map((shard) => `${shardPrefix}${shard}.${hostSuffix}:27017`)
    .join(',')

  return `mongodb://${credentials}@${hosts}/${database}?ssl=true&authSource=admin&replicaSet=${replicaSet}&retryWrites=true&w=majority`
}

function getMongoUri(): string {
  const rawUri =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb://localhost:27017/store-app'
  return normalizeMongoUri(rawUri)
}

function maskMongoUri(uri: string): string {
  return uri.replace(/:([^@/]+)@/, ':****@')
}

function getRawMongoUri(): string {
  return (
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb://localhost:27017/store-app'
  )
}

function buildAtlasDirectShardUris(uri: string): string[] {
  const hostMatch = uri.match(
    /^mongodb:\/\/([^@]+)@([a-z0-9-]+-shard-00-)(\d{2})\.([^/:,]+)/i
  )
  if (!hostMatch) return []

  const [, credentials, shardPrefix, , hostSuffix] = hostMatch
  const dbMatch = uri.match(/\/([^/?]+)(?:\?|$)/)
  const database = dbMatch?.[1] || 'store-app'
  const params =
    '?ssl=true&authSource=admin&directConnection=true&retryWrites=true&w=majority'

  return ['00', '01', '02'].map(
    (shard) =>
      `mongodb://${credentials}@${shardPrefix}${shard}.${hostSuffix}:27017/${database}${params}`
  )
}

class MongoDB {
  private client: MongoClient | null = null
  private db: Db | null = null
  private uri: string
  private connecting: Promise<boolean> | null = null

  constructor() {
    this.uri = getMongoUri()
  }

  private getClientOptions(isLocal: boolean) {
    if (isLocal) {
      return {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 30000,
        socketTimeoutMS: 45000,
      }
    }

    // SSL/TLS is configured via ssl=true in the Atlas connection string.
    return {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 60000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    }
  }

  async ping(): Promise<boolean> {
    if (!this.db) return false
    await this.db.admin().command({ ping: 1 })
    return true
  }

  async connect(force = false): Promise<boolean> {
    if (this.connecting) {
      return this.connecting
    }

    this.connecting = this.connectInternal(force).finally(() => {
      this.connecting = null
    })

    return this.connecting
  }

  private async establishConnection(uri: string, isLocal: boolean): Promise<void> {
    const options = this.getClientOptions(isLocal)
    const client = new MongoClient(uri, options)

    try {
      await client.connect()
      const db = client.db('store-app')
      await db.admin().command({ ping: 1 })
      this.client = client
      this.db = db
      this.uri = uri
    } catch (error) {
      await client.close().catch(() => {})
      throw error
    }
  }

  private async connectInternal(force = false): Promise<boolean> {
    try {
      const latestUri = getMongoUri()

      if (this.client && this.uri !== latestUri) {
        console.log('♻️ MongoDB URI changed, reconnecting...')
        await this.disconnect()
      }

      this.uri = latestUri

      // Skip connection during build time
      if (process.env.SKIP_DB_CONNECTION === 'true' || !this.uri || this.uri.includes('dummy')) {
        console.log('⚠️  Skipping MongoDB connection (build time or dummy URL)')
        return false
      }

      // اگر قبلاً متصل شده، سلامت اتصال را بررسی کن
      if (!force && this.client && this.db) {
        try {
          await this.ping()
          console.log('✅ Already connected to MongoDB')
          return true
        } catch {
          console.warn('⚠️ MongoDB connection stale, reconnecting...')
          await this.disconnect()
        }
      }

      console.log('🔌 Connecting to MongoDB:', maskMongoUri(this.uri))

      const isLocal =
        this.uri.includes('localhost') ||
        this.uri.includes('127.0.0.1') ||
        this.uri.includes('mongodb:')

      try {
        await this.establishConnection(this.uri, isLocal)
        console.log('✅ MongoDB connected successfully to database: store-app')
        return true
      } catch (primaryError) {
        if (isLocal) throw primaryError

        const fallbacks = buildAtlasDirectShardUris(getRawMongoUri())
        if (fallbacks.length === 0) throw primaryError

        let lastError: unknown = primaryError
        for (const fallbackUri of fallbacks) {
          if (fallbackUri === this.uri) continue

          await this.disconnect()
          try {
            console.log('🔁 Trying MongoDB shard fallback:', maskMongoUri(fallbackUri))
            await this.establishConnection(fallbackUri, false)
            console.log('✅ MongoDB connected via shard fallback to database: store-app')
            return true
          } catch (fallbackError) {
            lastError = fallbackError
          }
        }

        throw lastError
      }
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error)
      throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close()
        this.client = null
        this.db = null
        console.log('🔌 MongoDB disconnected')
      }
    } catch (error) {
      console.error('❌ MongoDB disconnect error:', error)
    }
  }

  // Collections getters
  get users(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('users')
  }

  get categories(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('categories')
  }

  get brands(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('brands')
  }

  get products(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('products')
  }

  get settings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('settings')
  }

  get heroSliders(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('hero_sliders')
  }

  get homepageSections(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('homepage_sections')
  }

  get orders(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('orders')
  }

  get invoices(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('invoices')
  }

  get provinces(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('provinces')
  }

  get seopages(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('seo_pages')
  }

  get seoglobalsettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('seo_global_settings')
  }

  get globalsettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('globalsettings')
  }

  get cities(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('cities')
  }

  get dynamicContent(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('dynamic_content')
  }

  get userBehaviors(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('user_behaviors')
  }

  get trendSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('trendSettings')
  }

  get orderItems(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('order_items')
  }

  get reviews(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('reviews')
  }

  get carts(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('carts')
  }

  get cartItems(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('cart_items')
  }

  get wishlist(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('wishlist')
  }

  get moduleSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('moduleSettings')
  }

  get hoverProductsSections(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('hoverProductsSections')
  }

  get downloads(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('downloads')
  }

  get addresses(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('addresses')
  }

  get chatHistory(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('chat_history')
  }

  get chatbotSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('chatbot_settings')
  }

  get smsSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('smsSettings')
  }

  get tabbedProducts2Settings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('tabbedProducts2Settings')
  }

  get tabbedProducts2IntroSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('tabbedProducts2IntroSettings')
  }

  get discountSections(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('discount_sections')
  }

  // Blog collections
  get blogPosts(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('blogPosts')
  }

  get blogCategories(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('blogCategories')
  }

  get blogTags(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('blogTags')
  }

  get blogComments(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('blogComments')
  }

  get fonts(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('fonts')
  }

  get payments(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('payments')
  }

  get paymentGateways(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('paymentGateways')
  }

  get faqs(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('faqs')
  }

  get schemas(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('schemas')
  }

  get invoiceSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('invoiceSettings')
  }

  get tickets(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('tickets')
  }

  // Cron Jobs collection
  get cronJobs(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('cronJobs')
  }

  get emailQueue(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('emailQueue')
  }

  get discounts(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('discounts')
  }

  // Analytics collections
  get analytics(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('analytics')
  }

  get pageViews(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('pageViews')
  }

  get visitorSessions(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('visitorSessions')
  }

  get verificationCodes(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('verificationCodes')
  }

  // Discount collections
  get discountCodes(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('discountCodes')
  }

  get discountUsages(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('discountUsages')
  }

  // Security collections
  get securitySettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('security_settings')
  }

  get securityLogs(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('security_logs')
  }

  get blockedIPs(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('blocked_ips')
  }

  get auditTrail(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('audit_trail')
  }

  // License System collection
  get licenses(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('licenses')
  }

  // License verification logs collection
  get licenseVerificationLogs(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('license_verification_logs')
  }

  // OTP collection for verification codes
  get otpCodes(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('otp_codes')
  }

  get shippingZones(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('shipping_zones')
  }

  get shippingSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('shipping_settings')
  }

  get trustBadgeSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('trust_badge_settings')
  }

  get guaranteeSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('guarantee_settings')
  }

  get testimonialSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('testimonial_settings')
  }

  get featuresSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('features_settings')
  }

  get latestProductsSettings(): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection('latest_products_settings')
  }

  get siteHeaderSettings(): Collection {
    if (!this.db) throw new Error('Database not connected');
    return this.db.collection('siteHeaderSettings');
  }

  get nextRocketSettings(): Collection {
    if (!this.db) throw new Error('Database not connected');
    return this.db.collection('nextRocketSettings');
  }
  
  get whyUsSectionSettings(): Collection {
    if (!this.db) throw new Error('Database not connected');
    return this.db.collection('whyUsSectionSettings');
  }
  
  get categorySectionSettings(): Collection {
    if (!this.db) throw new Error('Database not connected');
    return this.db.collection('categorySectionSettings');
  }
  
  get megaMenuSettings(): Collection {
    if (!this.db) throw new Error('Database not connected');
    return this.db.collection('megaMenuSettings');
  }

  get siteTemplates(): Collection {
    if (!this.db) throw new Error('Database not connected');
    return this.db.collection('site_templates');
  }

  get siteInstances(): Collection {
    if (!this.db) throw new Error('Database not connected');
    return this.db.collection('site_instances');
  }

  // Public method to get any collection
  getCollection(name: string): Collection {
    if (!this.db) throw new Error('Database not connected')
    return this.db.collection(name)
  }
}

// Global instance
const globalForMongoDB = globalThis as unknown as {
  mongodb: MongoDB | undefined
}

export const mongodb = globalForMongoDB.mongodb ?? new MongoDB()

if (process.env.NODE_ENV !== 'production') {
  globalForMongoDB.mongodb = mongodb
}

// Helper function to ensure connection
function isRecoverableMongoError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String(error.name) : ''
  const message = 'message' in error ? String(error.message) : ''
  return (
    name.includes('MongoServerSelectionError') ||
    name.includes('MongoNetworkError') ||
    message.includes('SSL routines') ||
    message.includes('connection timed out') ||
    message.includes('connection closed')
  )
}

export async function connectDB(): Promise<MongoDB> {
  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongodb.connect(attempt > 1)
      return mongodb
    } catch (error) {
      if (attempt < maxAttempts && isRecoverableMongoError(error)) {
        console.warn(`⚠️ MongoDB connect attempt ${attempt} failed, retrying...`)
        await mongodb.disconnect()
        continue
      }
      throw error
    }
  }

  return mongodb
}

export async function withDbRetry<T>(operation: (db: MongoDB) => Promise<T>): Promise<T> {
  try {
    const db = await connectDB()
    return await operation(db)
  } catch (error) {
    if (!isRecoverableMongoError(error)) throw error

    console.warn('⚠️ MongoDB operation failed, reconnecting and retrying once...')
    await mongodb.disconnect()
    const db = await connectDB()
    return await operation(db)
  }
}

// Specific getter functions for easier imports
export async function getVerificationCodes() {
  await connectDB()
  return mongodb.verificationCodes
}
