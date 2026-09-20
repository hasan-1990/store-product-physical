/**
 * Multi-Layer Cache Manager
 * مدیریت کش دو لایه (Memory + Disk)
 * Redis حذف شد تا با کش اصلی سایت تداخل نداشته باشد
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { CacheEntry, CacheStats } from '../types';

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private cacheDir: string;
  private maxMemorySize: number = 100 * 1024 * 1024; // 100MB
  private maxDiskSize: number = 2 * 1024 * 1024 * 1024; // 2GB

  private constructor() {
    this.cacheDir = path.join(process.cwd(), '.next-rocket-cache');
    this.initializeRedis();
    this.initializeDiskCache();
  }

  static getInstance(): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager();
    }
    return this.instance;
  }

  /**
   * راه‌اندازی Redis (حذف شده - Next Rocket از Memory Cache استفاده می‌کند)
   * Redis اصلی سایت را مدیریت می‌کند، نیازی به Redis جداگانه نیست
   */
  private async initializeRedis() {
    // Redis removed to avoid conflicts with main site cache
    console.log('ℹ️ Next Rocket از Memory + Disk Cache استفاده می‌کند');
  }

  /**
   * ایجاد پوشه کش
   */
  private async initializeDiskCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('❌ خطا در ایجاد پوشه کش:', error);
    }
  }

  /**
   * دریافت از کش (Layer 1: Memory → Layer 2: Redis → Layer 3: Disk)
   */
  async get(key: string): Promise<string | null> {
    // Layer 1: Memory Cache (سریع‌ترین)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      memoryEntry.hits++;
      return memoryEntry.value;
    }

    // Layer 2: Disk Cache (Redis removed)
    try {
      const diskPath = this.getDiskPath(key);
      const exists = await fs.access(diskPath).then(() => true).catch(() => false);
      
      if (exists) {
        const content = await fs.readFile(diskPath, 'utf-8');
        const entry: CacheEntry = JSON.parse(content);
        
        if (!this.isExpired(entry)) {
          // ذخیره در Memory برای دفعات بعد
          await this.setMemory(key, entry.value, entry.type, entry.tags);
          return entry.value;
        }
      }
    } catch (error) {
      console.warn('⚠️ خطا در خواندن از Disk:', error);
    }

    return null;
  }

  /**
   * ذخیره در کش (هر 3 لایه)
   */
  async set(
    key: string,
    value: string,
    type: CacheEntry['type'] = 'page',
    ttl: number = 600, // 10 دقیقه
    tags: string[] = []
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl * 1000);

    // Layer 1: Memory
    await this.setMemory(key, value, type, tags, expiresAt);

    // Layer 2: Redis
    // Layer 2: Disk (Redis removed)
    try {
      const entry: CacheEntry = {
        key,
        value,
        type,
        size: Buffer.byteLength(value, 'utf-8'),
        createdAt: new Date(),
        expiresAt,
        hits: 0,
        tags,
      };

      const diskPath = this.getDiskPath(key);
      await fs.mkdir(path.dirname(diskPath), { recursive: true });
      await fs.writeFile(diskPath, JSON.stringify(entry), 'utf-8');
    } catch (error) {
      console.warn('⚠️ خطا در ذخیره در Disk:', error);
    }
  }

  /**
   * ذخیره در Memory Cache
   */
  private async setMemory(
    key: string,
    value: string,
    type: CacheEntry['type'],
    tags: string[],
    expiresAt?: Date
  ): Promise<void> {
    const size = Buffer.byteLength(value, 'utf-8');

    // چک کردن حد مجاز Memory
    if (this.getMemorySize() + size > this.maxMemorySize) {
      await this.evictMemory();
    }

    const entry: CacheEntry = {
      key,
      value,
      type,
      size,
      createdAt: new Date(),
      expiresAt: expiresAt || new Date(Date.now() + 600000),
      hits: 0,
      tags,
    };

    this.memoryCache.set(key, entry);
  }

  /**
   * حذف قدیمی‌ترین آیتم‌ها از Memory (LRU)
   */
  private async evictMemory(): Promise<void> {
    const entries = Array.from(this.memoryCache.entries());
    
    // مرتب کردن بر اساس hits (کمترین استفاده)
    entries.sort((a, b) => a[1].hits - b[1].hits);

    // حذف 20% قدیمی‌ترین‌ها
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }

    console.log(`🗑️  ${toRemove} آیتم از Memory Cache حذف شد`);
  }

  /**
   * حذف از کش
   */
  async delete(key: string): Promise<void> {
    // Memory
    this.memoryCache.delete(key);

    // Disk (Redis removed)
    try {
      const diskPath = this.getDiskPath(key);
      await fs.unlink(diskPath);
    } catch (error) {
      // فایل وجود نداشته
    }
  }

  /**
   * حذف بر اساس tag
   */
  async deleteByTag(tag: string): Promise<number> {
    let deleted = 0;

    // Memory (Redis removed)
    const memoryKeys = Array.from(this.memoryCache.entries())
      .filter(([_, entry]) => entry.tags.includes(tag))
      .map(([key]) => key);
    
    for (const key of memoryKeys) {
      await this.delete(key);
      deleted++;
    }

    return deleted;
  }

  /**
   * پاک کردن تمام کش
   */
  async clear(): Promise<void> {
    // Memory
    this.memoryCache.clear();

    // Disk (Redis removed)
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await this.initializeDiskCache();
    } catch (error) {
      console.error('❌ خطا در پاک کردن Disk Cache:', error);
    }

    console.log('🗑️  تمام کش پاک شد');
  }

  /**
   * دریافت آمار کش
   */
  async getStats(): Promise<CacheStats> {
    const memorySize = this.getMemorySize();
    const memoryEntries = this.memoryCache.size;

    // Redis removed - only Memory + Disk now
    const diskSize = await this.getDiskSize();
    const diskEntries = await this.getDiskEntries();

    // محاسبه Hit Rate
    let totalHits = 0;
    let totalRequests = 0;
    this.memoryCache.forEach(entry => {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // +1 برای اولین بار
    });

    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    const missRate = 100 - hitRate;

    return {
      totalEntries: memoryEntries + diskEntries,
      totalSize: memorySize + diskSize,
      hitRate,
      missRate,
      memoryUsage: memorySize,
      redisUsage: 0, // Redis removed
      diskUsage: diskSize,
    };
  }

  /**
   * گرفتن سایز Memory Cache
   */
  private getMemorySize(): number {
    let size = 0;
    this.memoryCache.forEach(entry => {
      size += entry.size;
    });
    return size;
  }

  /**
   * گرفتن سایز Disk Cache
   */
  private async getDiskSize(): Promise<number> {
    try {
      let size = 0;
      const files = await this.getAllDiskFiles();
      for (const file of files) {
        const stats = await fs.stat(file);
        size += stats.size;
      }
      return size;
    } catch {
      return 0;
    }
  }

  /**
   * تعداد فایل‌های Disk Cache
   */
  private async getDiskEntries(): Promise<number> {
    try {
      const files = await this.getAllDiskFiles();
      return files.length;
    } catch {
      return 0;
    }
  }

  /**
   * گرفتن تمام فایل‌های کش از Disk
   */
  private async getAllDiskFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scan(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.name.endsWith('.json')) {
            files.push(fullPath);
          }
        }
      } catch {
        // پوشه وجود نداره
      }
    }

    await scan(this.cacheDir);
    return files;
  }

  /**
   * مسیر فایل در Disk
   */
  private getDiskPath(key: string): string {
    const hash = crypto.createHash('md5').update(key).digest('hex');
    const subDir = hash.substring(0, 2);
    return path.join(this.cacheDir, subDir, `${hash}.json`);
  }

  /**
   * چک کردن انقضا
   */
  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  /**
   * پاکسازی خودکار کش منقضی شده
   */
  async cleanup(): Promise<number> {
    let cleaned = 0;

    // Memory
    const memoryKeys = Array.from(this.memoryCache.entries())
      .filter(([_, entry]) => this.isExpired(entry))
      .map(([key]) => key);
    
    for (const key of memoryKeys) {
      this.memoryCache.delete(key);
      cleaned++;
    }

    // Disk
    const diskFiles = await this.getAllDiskFiles();
    for (const file of diskFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const entry: CacheEntry = JSON.parse(content);
        if (this.isExpired(entry)) {
          await fs.unlink(file);
          cleaned++;
        }
      } catch {
        // فایل خراب - حذف
        await fs.unlink(file);
        cleaned++;
      }
    }

    console.log(`🗑️  ${cleaned} آیتم منقضی شده پاک شد`);
    return cleaned;
  }
}

export default CacheManager.getInstance();
