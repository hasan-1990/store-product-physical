/**
 * @deprecated Use functions from `@/lib/seo-fallback-storage` directly.
 * Thin wrapper kept for backward compatibility.
 */
import {
  cleanupFallbackPages,
  deleteFallbackPage,
  deleteFallbackPageByUrl,
  getFallbackPage,
  getFallbackPageByUrl,
  loadFallbackPages,
  saveFallbackPage,
  saveFallbackPages,
  syncFallbackFromDatabase,
  type FallbackSEOPage,
  type SEOFallbackData,
} from './seo-fallback-storage';

export type { FallbackSEOPage, SEOFallbackData };

export class SEOFallbackManager {
  static read = loadFallbackPages;
  static write = saveFallbackPages;

  static async upsert(pageData: SEOFallbackData): Promise<boolean> {
    try {
      await saveFallbackPage(pageData);
      return true;
    } catch {
      return false;
    }
  }

  static delete = deleteFallbackPageByUrl;
  static cleanup = cleanupFallbackPages;
  static syncFromDatabase = syncFallbackFromDatabase;
}

export {
  cleanupFallbackPages,
  deleteFallbackPage,
  deleteFallbackPageByUrl,
  getFallbackPage,
  getFallbackPageByUrl,
  loadFallbackPages,
  saveFallbackPage,
  saveFallbackPages,
  syncFallbackFromDatabase,
};

export default SEOFallbackManager;
