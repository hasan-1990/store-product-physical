import { MongoClient, Db, Collection, Document } from 'mongodb';

function getMongoUri(): string {
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop_template';
}

function getDatabaseName(uri: string): string {
  const match = uri.match(/\/([^/?]+)(?:\?|$)/);
  return match?.[1] || 'shop_template';
}

export type ShopDb = {
  products: Collection<Document>;
  cartItems: Collection<Document>;
  orders: Collection<Document>;
  users: Collection<Document>;
  admins: Collection<Document>;
  siteContent: Collection<Document>;
  promoCodes: Collection<Document>;
  addresses: Collection<Document>;
  favorites: Collection<Document>;
  campaigns: Collection<Document>;
  userProfiles: Collection<Document>;
};

class MongoDB {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connecting: Promise<boolean> | null = null;

  async connect(): Promise<boolean> {
    if (this.connecting) return this.connecting;

    this.connecting = this.connectInternal().finally(() => {
      this.connecting = null;
    });

    return this.connecting;
  }

  private async connectInternal(): Promise<boolean> {
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      return false;
    }

    const uri = getMongoUri();

    if (this.client && this.db) {
      try {
        await this.db.admin().command({ ping: 1 });
        return true;
      } catch {
        await this.disconnect();
      }
    }

    const isLocal =
      uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('mongodb:');

    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: isLocal ? 5000 : 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: isLocal ? 20 : 10,
    });

    await client.connect();
    const db = client.db(getDatabaseName(uri));
    await db.admin().command({ ping: 1 });

    this.client = client;
    this.db = db;
    return true;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close().catch(() => {});
    }
    this.client = null;
    this.db = null;
  }

  async getCollections(): Promise<ShopDb> {
    await this.connect();
    if (!this.db) {
      throw new Error('MongoDB is not connected');
    }

    return {
      products: this.db.collection('products'),
      cartItems: this.db.collection('cartItems'),
      orders: this.db.collection('orders'),
      users: this.db.collection('users'),
      admins: this.db.collection('admins'),
      siteContent: this.db.collection('siteContent'),
      promoCodes: this.db.collection('promoCodes'),
      addresses: this.db.collection('addresses'),
      favorites: this.db.collection('favorites'),
      campaigns: this.db.collection('campaigns'),
      userProfiles: this.db.collection('userProfiles'),
    };
  }
}

const globalForMongo = globalThis as typeof globalThis & { __shopMongo?: MongoDB };

export const mongodb = globalForMongo.__shopMongo ?? new MongoDB();

if (process.env.NODE_ENV !== 'production') {
  globalForMongo.__shopMongo = mongodb;
}

export async function connectDB(): Promise<ShopDb> {
  return mongodb.getCollections();
}
