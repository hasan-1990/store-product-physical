// Fallback storage for SEO pages when database is not available
import { promises as fs } from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'seo-fallback-storage.json');

export interface FallbackSEOPage {
  _id: string;
  url: string;
  title: string;
  description: string;
  keywords?: string;
  h1Title?: string;
  h2Title?: string;
  content?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsContent?: string;
  structuredData?: any;
  customMeta?: any;
  isActive: boolean;
  isDiscovered?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Ensure directory exists
async function ensureDirectoryExists() {
  const dir = path.dirname(STORAGE_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Load pages from fallback storage
export async function loadFallbackPages(): Promise<FallbackSEOPage[]> {
  try {
    await ensureDirectoryExists();
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    const pages = JSON.parse(data);
    console.log(`📁 Loaded ${pages.length} pages from fallback storage`);
    return pages;
  } catch (error) {
    console.log('📁 No fallback storage file found, returning empty array');
    return [];
  }
}

// Save pages to fallback storage
export async function saveFallbackPages(pages: FallbackSEOPage[]) {
  try {
    await ensureDirectoryExists();
    await fs.writeFile(STORAGE_FILE, JSON.stringify(pages, null, 2), 'utf-8');
    console.log(`💾 Saved ${pages.length} pages to fallback storage`);
  } catch (error) {
    console.error('❌ Error saving to fallback storage:', error);
  }
}

// Save or update a single page
export async function saveFallbackPage(pageData: Omit<FallbackSEOPage, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }): Promise<FallbackSEOPage> {
  const pages = await loadFallbackPages();
  const now = new Date().toISOString();
  
  if (pageData._id) {
    // Update existing page
    const index = pages.findIndex(p => p._id === pageData._id);
    if (index >= 0) {
      pages[index] = {
        ...pageData as FallbackSEOPage,
        _id: pageData._id,
        updatedAt: now,
        createdAt: pages[index].createdAt
      };
      await saveFallbackPages(pages);
      console.log(`📝 Updated page: ${pageData.url}`);
      return pages[index];
    }
  }
  
  // Create new page
  const newPage: FallbackSEOPage = {
    ...pageData as FallbackSEOPage,
    _id: pageData._id || `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now
  };
  
  pages.push(newPage);
  await saveFallbackPages(pages);
  console.log(`📝 Created new page: ${newPage.url}`);
  return newPage;
}

// Delete a page
export async function deleteFallbackPage(id: string): Promise<boolean> {
  const pages = await loadFallbackPages();
  const initialLength = pages.length;
  const filteredPages = pages.filter(p => p._id !== id);
  
  if (filteredPages.length < initialLength) {
    await saveFallbackPages(filteredPages);
    console.log(`🗑️ Deleted page with ID: ${id}`);
    return true;
  }
  
  return false;
}

// Get a single page by ID
export async function getFallbackPage(id: string): Promise<FallbackSEOPage | null> {
  const pages = await loadFallbackPages();
  return pages.find(p => p._id === id) || null;
}

export async function getFallbackPageByUrl(url: string): Promise<FallbackSEOPage | null> {
  const pages = await loadFallbackPages();
  return pages.find(p => p.url === url && p.isActive !== false) || null;
}

export async function deleteFallbackPageByUrl(url: string): Promise<boolean> {
  const pages = await loadFallbackPages();
  const filtered = pages.filter(p => p.url !== url);
  if (filtered.length === pages.length) return false;
  await saveFallbackPages(filtered);
  return true;
}

export async function syncFallbackFromDatabase(
  pages: Array<Partial<FallbackSEOPage> & { url: string; title: string; description: string }>
): Promise<void> {
  const now = new Date().toISOString();
  const normalized: FallbackSEOPage[] = pages.map((page) => ({
    _id: page._id?.toString() || `fallback_${page.url}`,
    url: page.url,
    title: page.title,
    description: page.description,
    keywords: page.keywords || '',
    h1Title: page.h1Title || '',
    h2Title: page.h2Title || '',
    content: page.content || '',
    ogTitle: page.ogTitle || '',
    ogDescription: page.ogDescription || '',
    ogImage: page.ogImage || '',
    twitterTitle: page.twitterTitle || '',
    twitterDescription: page.twitterDescription || '',
    twitterImage: page.twitterImage || '',
    canonicalUrl: page.canonicalUrl || '',
    robotsContent: page.robotsContent || 'index, follow',
    structuredData: page.structuredData || null,
    customMeta: page.customMeta || {},
    isActive: page.isActive !== false,
    isDiscovered: page.isDiscovered,
    createdAt: page.createdAt?.toString?.() || now,
    updatedAt: now,
  }));
  await saveFallbackPages(normalized);
}

export async function cleanupFallbackPages(): Promise<number> {
  const data = await loadFallbackPages();
  const uniqueData = new Map<string, FallbackSEOPage>();

  for (const item of data) {
    const existing = uniqueData.get(item.url);
    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      uniqueData.set(item.url, item);
    }
  }

  const cleaned = Array.from(uniqueData.values()).map((item) => {
    if (item.title.includes('تنظیمات SEO برای')) {
      const urlPath = item.url === '/' ? 'صفحه اصلی' : item.url.replace(/^\//, '');
      return {
        ...item,
        title: `${urlPath} - عنوان صفحه`,
        description: `توضیحات صفحه ${urlPath}`,
      };
    }
    return item;
  });

  await saveFallbackPages(cleaned);
  return data.length - cleaned.length;
}

// Alias type for backward compatibility
export type SEOFallbackData = FallbackSEOPage;