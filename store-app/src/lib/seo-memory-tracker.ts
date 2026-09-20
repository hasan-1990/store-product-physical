/**
 * ردیابی تاریخچه تحلیل‌های SEO با استفاده از MCP Memory
 * این ماژول از MCP Memory Server برای ذخیره و بازیابی تاریخچه تحلیل‌ها استفاده می‌کند
 */

export interface SEOAnalysisSnapshot {
  url: string;
  timestamp: string;
  score: number;
  titleScore: number;
  descriptionScore: number;
  contentScore: number;
  technicalScore: number;
  issues: string[];
  suggestions: string[];
  metrics: {
    titleLength: number;
    descriptionLength: number;
    wordCount: number;
    h1Count: number;
    h2Count: number;
    imageCount: number;
    loadTime: number;
  };
}

export interface SEOTrend {
  url: string;
  snapshots: SEOAnalysisSnapshot[];
  averageScore: number;
  trend: 'improving' | 'declining' | 'stable';
  lastAnalyzed: string;
}

/**
 * مدیریت تاریخچه تحلیل‌های SEO
 * 
 * این کلاس می‌تواند به MCP Memory Server متصل شود برای:
 * - ذخیره نتایج تحلیل‌ها
 * - مقایسه تحلیل‌های قبلی و فعلی
 * - شناسایی روند بهبود یا افت SEO
 */
export class SEOMemoryTracker {
  private static MEMORY_KEY_PREFIX = 'seo_analysis_';
  private static MAX_SNAPSHOTS = 30; // حداکثر ۳۰ snapshot برای هر URL

  /**
   * ذخیره snapshot جدید از تحلیل SEO
   */
  static async saveSnapshot(analysis: SEOAnalysisSnapshot): Promise<boolean> {
    try {
      const key = `${this.MEMORY_KEY_PREFIX}${analysis.url}`;
      
      // دریافت تاریخچه قبلی
      const history = await this.getHistory(analysis.url);
      
      // اضافه کردن snapshot جدید
      history.snapshots.push(analysis);
      
      // محدود کردن به MAX_SNAPSHOTS آخر
      if (history.snapshots.length > this.MAX_SNAPSHOTS) {
        history.snapshots = history.snapshots.slice(-this.MAX_SNAPSHOTS);
      }
      
      // محاسبه میانگین امتیاز
      history.averageScore = this.calculateAverageScore(history.snapshots);
      
      // تشخیص روند
      history.trend = this.detectTrend(history.snapshots);
      history.lastAnalyzed = analysis.timestamp;
      
      // ذخیره در localStorage (می‌تواند به MCP Memory متصل شود)
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(history));
      }
      
      console.log(`✅ SEO snapshot ذخیره شد: ${analysis.url} (Score: ${analysis.score})`);
      return true;
    } catch (error) {
      console.error('❌ خطا در ذخیره SEO snapshot:', error);
      return false;
    }
  }

  /**
   * دریافت تاریخچه تحلیل‌ها برای یک URL
   */
  static async getHistory(url: string): Promise<SEOTrend> {
    try {
      const key = `${this.MEMORY_KEY_PREFIX}${url}`;
      
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) {
          return JSON.parse(stored);
        }
      }
      
      // اگر تاریخچه‌ای نبود، یک تاریخچه خالی برگردان
      return {
        url,
        snapshots: [],
        averageScore: 0,
        trend: 'stable',
        lastAnalyzed: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ خطا در دریافت تاریخچه SEO:', error);
      return {
        url,
        snapshots: [],
        averageScore: 0,
        trend: 'stable',
        lastAnalyzed: new Date().toISOString()
      };
    }
  }

  /**
   * مقایسه دو snapshot
   */
  static compareSnapshots(
    current: SEOAnalysisSnapshot,
    previous: SEOAnalysisSnapshot
  ): {
    scoreDiff: number;
    improvements: string[];
    regressions: string[];
  } {
    const scoreDiff = current.score - previous.score;
    const improvements: string[] = [];
    const regressions: string[] = [];

    // مقایسه امتیازها
    if (current.titleScore > previous.titleScore) {
      improvements.push('بهبود عنوان صفحه');
    } else if (current.titleScore < previous.titleScore) {
      regressions.push('افت کیفیت عنوان');
    }

    if (current.descriptionScore > previous.descriptionScore) {
      improvements.push('بهبود توضیحات');
    } else if (current.descriptionScore < previous.descriptionScore) {
      regressions.push('افت کیفیت توضیحات');
    }

    if (current.contentScore > previous.contentScore) {
      improvements.push('بهبود محتوا');
    } else if (current.contentScore < previous.contentScore) {
      regressions.push('کاهش کیفیت محتوا');
    }

    // مقایسه metrics
    if (current.metrics.loadTime < previous.metrics.loadTime) {
      improvements.push('بهبود سرعت بارگذاری');
    } else if (current.metrics.loadTime > previous.metrics.loadTime * 1.2) {
      regressions.push('کاهش سرعت بارگذاری');
    }

    if (current.metrics.wordCount > previous.metrics.wordCount * 1.1) {
      improvements.push('افزایش محتوای متنی');
    }

    return {
      scoreDiff,
      improvements,
      regressions
    };
  }

  /**
   * محاسبه میانگین امتیاز
   */
  private static calculateAverageScore(snapshots: SEOAnalysisSnapshot[]): number {
    if (snapshots.length === 0) return 0;
    const sum = snapshots.reduce((acc, s) => acc + s.score, 0);
    return Math.round(sum / snapshots.length);
  }

  /**
   * تشخیص روند بهبود یا افت
   */
  private static detectTrend(snapshots: SEOAnalysisSnapshot[]): 'improving' | 'declining' | 'stable' {
    if (snapshots.length < 3) return 'stable';

    // مقایسه ۵ تحلیل اخیر با ۵ تحلیل قبل از آن
    const recentCount = Math.min(5, Math.floor(snapshots.length / 2));
    const recent = snapshots.slice(-recentCount);
    const older = snapshots.slice(-recentCount * 2, -recentCount);

    if (older.length === 0) return 'stable';

    const recentAvg = this.calculateAverageScore(recent);
    const olderAvg = this.calculateAverageScore(older);

    const diff = recentAvg - olderAvg;

    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  /**
   * دریافت گزارش روند برای چندین URL
   */
  static async getTrendReport(urls: string[]): Promise<{
    improving: string[];
    declining: string[];
    stable: string[];
  }> {
    const report = {
      improving: [] as string[],
      declining: [] as string[],
      stable: [] as string[]
    };

    for (const url of urls) {
      const history = await this.getHistory(url);
      report[history.trend].push(url);
    }

    return report;
  }

  /**
   * پاکسازی تاریخچه‌های قدیمی
   */
  static async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      let cleaned = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage).filter(k => 
          k.startsWith(this.MEMORY_KEY_PREFIX)
        );

        for (const key of keys) {
          const data = localStorage.getItem(key);
          if (data) {
            const history: SEOTrend = JSON.parse(data);
            const lastDate = new Date(history.lastAnalyzed);
            
            if (lastDate < cutoffDate) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        }
      }

      console.log(`🧹 ${cleaned} تاریخچه قدیمی پاک شد`);
      return cleaned;
    } catch (error) {
      console.error('❌ خطا در cleanup تاریخچه:', error);
      return 0;
    }
  }

  /**
   * Export کردن تمام تاریخچه‌ها
   */
  static async exportAll(): Promise<SEOTrend[]> {
    const allHistories: SEOTrend[] = [];

    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => 
        k.startsWith(this.MEMORY_KEY_PREFIX)
      );

      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          allHistories.push(JSON.parse(data));
        }
      }
    }

    return allHistories;
  }
}

export default SEOMemoryTracker;
