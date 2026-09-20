import * as cheerio from 'cheerio';
import crypto from 'crypto';

export interface ContentAnalysisResult {
  contentHash: string;
  uniquenessScore: number;
  readabilityScore: number;
  keywordDensity: Record<string, number>;
  duplicateContent: boolean;
  duplicatePages: string[];
  issues: string[];
  suggestions: string[];
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  fleschReadingEase: number;
  keywordOveruse: string[];
  missingKeywords: string[];
  contentLength: 'too_short' | 'optimal' | 'too_long';
  headingStructure: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hasProperHierarchy: boolean;
    missingHeadings: string[];
  };
  imageAnalysis: {
    totalImages: number;
    imagesWithoutAlt: number;
    imagesWithPoorAlt: number;
    imageOptimizationSuggestions: string[];
  };
  internalLinkingScore: number;
  externalLinkingScore: number;
  semanticAnalysis: {
    topicRelevance: number;
    entityMentions: string[];
    relatedTopics: string[];
  };
}

export interface ContentQualityMetrics {
  originalityScore: number;
  relevanceScore: number;
  engagementScore: number;
  technicalScore: number;
  overallScore: number;
}

export class ContentOptimizer {
  private contentDatabase: Map<string, { hash: string; url: string; title: string }> = new Map();

  /**
   * تحلیل جامع محتوای یک صفحه
   */
  async analyzePageContent(html: string, url: string, targetKeywords: string[] = []): Promise<ContentAnalysisResult> {
    const $ = cheerio.load(html);
    
    // استخراج محتوای متنی
    const textContent = this.extractTextContent($);
    const contentHash = this.generateContentHash(textContent);
    
    // تحلیل پایه
    const wordCount = this.countWords(textContent);
    const sentences = this.extractSentences(textContent);
    const paragraphs = this.extractParagraphs($);
    
    // محاسبه آمارهای خوانایی
    const readabilityMetrics = this.calculateReadabilityMetrics(textContent, sentences, paragraphs);
    
    // تحلیل کلمات کلیدی
    const keywordAnalysis = this.analyzeKeywords(textContent, targetKeywords);
    
    // بررسی duplicate content
    const duplicateAnalysis = this.checkForDuplicateContent(contentHash, url);
    
    // تحلیل ساختار headings
    const headingStructure = this.analyzeHeadingStructure($);
    
    // تحلیل تصاویر
    const imageAnalysis = this.analyzeImages($);
    
    // تحلیل لینک‌ها
    const linkingAnalysis = this.analyzeLinking($, url);
    
    // تحلیل semantic
    const semanticAnalysis = this.performSemanticAnalysis(textContent, targetKeywords);
    
    // تولید issues و suggestions
    const { issues, suggestions } = this.generateContentRecommendations({
      wordCount,
      keywordAnalysis,
      headingStructure,
      imageAnalysis,
      linkingAnalysis,
      readabilityMetrics,
      duplicateAnalysis
    });

    return {
      contentHash,
      uniquenessScore: duplicateAnalysis.uniquenessScore,
      readabilityScore: readabilityMetrics.fleschReadingEase,
      keywordDensity: keywordAnalysis.density,
      duplicateContent: duplicateAnalysis.isDuplicate,
      duplicatePages: duplicateAnalysis.duplicatePages,
      issues,
      suggestions,
      wordCount,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: readabilityMetrics.averageWordsPerSentence,
      averageSentencesPerParagraph: readabilityMetrics.averageSentencesPerParagraph,
      fleschReadingEase: readabilityMetrics.fleschReadingEase,
      keywordOveruse: keywordAnalysis.overusedKeywords,
      missingKeywords: keywordAnalysis.missingKeywords,
      contentLength: this.determineContentLength(wordCount),
      headingStructure,
      imageAnalysis,
      internalLinkingScore: linkingAnalysis.internalScore,
      externalLinkingScore: linkingAnalysis.externalScore,
      semanticAnalysis
    };
  }

  /**
   * استخراج محتوای متنی از HTML
   */
  private extractTextContent($: cheerio.CheerioAPI): string {
    // حذف عناصر غیرضروری
    $('script, style, nav, header, footer, aside').remove();
    
    // استخراج محتوای اصلی
    let mainContent = $('main').text();
    if (!mainContent) {
      mainContent = $('article').text();
    }
    if (!mainContent) {
      mainContent = $('body').text();
    }
    
    return mainContent.replace(/\s+/g, ' ').trim();
  }

  /**
   * تولید hash برای محتوا
   */
  private generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content.toLowerCase().replace(/\s+/g, '')).digest('hex');
  }

  /**
   * شمارش کلمات
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * استخراج جملات
   */
  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  }

  /**
   * استخراج پاراگراف‌ها
   */
  private extractParagraphs($: cheerio.CheerioAPI): string[] {
    const paragraphs: string[] = [];
    $('p').each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 0) {
        paragraphs.push(text);
      }
    });
    return paragraphs;
  }

  /**
   * محاسبه معیارهای خوانایی
   */
  private calculateReadabilityMetrics(text: string, sentences: string[], paragraphs: string[]) {
    const wordCount = this.countWords(text);
    const sentenceCount = sentences.length;
    const syllableCount = this.estimateSyllables(text);
    
    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const averageSentencesPerParagraph = paragraphs.length > 0 ? sentenceCount / paragraphs.length : 0;
    
    // محاسبه Flesch Reading Ease (تطبیق یافته برای فارسی)
    const fleschReadingEase = sentenceCount > 0 && wordCount > 0 
      ? 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * (syllableCount / wordCount))
      : 0;

    return {
      averageWordsPerSentence,
      averageSentencesPerParagraph,
      fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase))
    };
  }

  /**
   * تخمین تعداد هجاها (برای زبان فارسی)
   */
  private estimateSyllables(text: string): number {
    // تخمین ساده برای فارسی - هر کلمه تقریباً 2 هجا
    const words = text.split(/\s+/);
    return words.length * 2;
  }

  /**
   * تحلیل کلمات کلیدی
   */
  private analyzeKeywords(text: string, targetKeywords: string[]) {
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    // محاسبه تراکم کلمات کلیدی
    const density: Record<string, number> = {};
    const overusedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    targetKeywords.forEach(keyword => {
      const keywordWords = keyword.toLowerCase().split(/\s+/);
      let count = 0;
      
      // جستجوی کلمه کلیدی در متن
      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        if (keywordWords.every((word, index) => words[i + index] === word)) {
          count++;
        }
      }
      
      const densityPercent = totalWords > 0 ? (count / totalWords) * 100 : 0;
      density[keyword] = densityPercent;
      
      // بررسی overuse (بیش از 3%)
      if (densityPercent > 3) {
        overusedKeywords.push(keyword);
      }
      
      // بررسی missing (کمتر از 0.5%)
      if (densityPercent < 0.5) {
        missingKeywords.push(keyword);
      }
    });

    return { density, overusedKeywords, missingKeywords };
  }

  /**
   * بررسی duplicate content
   */
  private checkForDuplicateContent(contentHash: string, url: string) {
    const duplicatePages: string[] = [];
    let isDuplicate = false;
    
    // بررسی در database محتوا
    for (const [storedUrl, data] of this.contentDatabase) {
      if (data.hash === contentHash && storedUrl !== url) {
        duplicatePages.push(storedUrl);
        isDuplicate = true;
      }
    }
    
    // ذخیره محتوا در database
    this.contentDatabase.set(url, { hash: contentHash, url, title: '' });
    
    const uniquenessScore = isDuplicate ? Math.max(0, 100 - (duplicatePages.length * 20)) : 100;
    
    return { isDuplicate, duplicatePages, uniquenessScore };
  }

  /**
   * تحلیل ساختار headings
   */
  private analyzeHeadingStructure($: cheerio.CheerioAPI) {
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    
    const missingHeadings: string[] = [];
    let hasProperHierarchy = true;
    
    if (h1Count === 0) {
      missingHeadings.push('H1');
      hasProperHierarchy = false;
    }
    
    if (h1Count > 1) {
      missingHeadings.push('تنها یک H1 مجاز است');
      hasProperHierarchy = false;
    }
    
    if (h2Count === 0 && h3Count > 0) {
      missingHeadings.push('H2 قبل از H3 لازم است');
      hasProperHierarchy = false;
    }

    return {
      h1Count,
      h2Count,
      h3Count,
      hasProperHierarchy,
      missingHeadings
    };
  }

  /**
   * تحلیل تصاویر
   */
  private analyzeImages($: cheerio.CheerioAPI) {
    const images = $('img');
    const totalImages = images.length;
    let imagesWithoutAlt = 0;
    let imagesWithPoorAlt = 0;
    const imageOptimizationSuggestions: string[] = [];

    images.each((_, element) => {
      const alt = $(element).attr('alt');
      
      if (!alt) {
        imagesWithoutAlt++;
      } else if (alt.length < 3 || alt.length > 125) {
        imagesWithPoorAlt++;
      }
      
      // بررسی نام فایل
      const src = $(element).attr('src');
      if (src && /\d+x\d+|IMG_\d+|screenshot/i.test(src)) {
        imageOptimizationSuggestions.push(`نام فایل تصویر ${src} توصیفی نیست`);
      }
    });

    if (imagesWithoutAlt > 0) {
      imageOptimizationSuggestions.push(`${imagesWithoutAlt} تصویر فاقد Alt Text هستند`);
    }
    
    if (imagesWithPoorAlt > 0) {
      imageOptimizationSuggestions.push(`${imagesWithPoorAlt} تصویر Alt Text ضعیف دارند`);
    }

    return {
      totalImages,
      imagesWithoutAlt,
      imagesWithPoorAlt,
      imageOptimizationSuggestions
    };
  }

  /**
   * تحلیل لینک‌ها
   */
  private analyzeLinking($: cheerio.CheerioAPI, currentUrl: string) {
    const links = $('a[href]');
    let internalLinks = 0;
    let externalLinks = 0;
    
    links.each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        if (href.startsWith('/') || href.includes(new URL(currentUrl).hostname)) {
          internalLinks++;
        } else if (href.startsWith('http')) {
          externalLinks++;
        }
      }
    });

    const totalLinks = internalLinks + externalLinks;
    const internalScore = totalLinks > 0 ? Math.min(100, (internalLinks / totalLinks) * 100 * 1.5) : 0;
    const externalScore = externalLinks > 0 && externalLinks < 10 ? 100 : externalLinks >= 10 ? 50 : 0;

    return { internalScore, externalScore };
  }

  /**
   * تحلیل semantic
   */
  private performSemanticAnalysis(text: string, targetKeywords: string[]) {
    // تحلیل ساده semantic
    const words = text.toLowerCase().split(/\s+/);
    const entityMentions: string[] = [];
    const relatedTopics: string[] = [];
    
    // یافتن موضوعات مرتبط (ساده‌سازی شده)
    targetKeywords.forEach(keyword => {
      const keywordWords = keyword.split(/\s+/);
      keywordWords.forEach(word => {
        if (words.includes(word)) {
          entityMentions.push(word);
        }
      });
    });

    const topicRelevance = targetKeywords.length > 0 
      ? (entityMentions.length / targetKeywords.length) * 100 
      : 0;

    return {
      topicRelevance: Math.min(100, topicRelevance),
      entityMentions: [...new Set(entityMentions)],
      relatedTopics
    };
  }

  /**
   * تعیین طول محتوا
   */
  private determineContentLength(wordCount: number): 'too_short' | 'optimal' | 'too_long' {
    if (wordCount < 30) return 'too_short';
    if (wordCount > 2000) return 'too_long';
    return 'optimal';
  }

  /**
   * تولید توصیه‌های محتوا
   */
  private generateContentRecommendations(analysis: any) {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // بررسی طول محتوا
    if (analysis.wordCount < 30) {
      issues.push('محتوا کوتاه است');
      suggestions.push('محتوا را به حداقل 30 کلمه افزایش دهید');
    }

    // بررسی ساختار headings
    if (!analysis.headingStructure.hasProperHierarchy) {
      issues.push('ساختار headings مناسب نیست');
      suggestions.push('از ساختار صحیح H1 > H2 > H3 استفاده کنید');
    }

    // بررسی تصاویر
    if (analysis.imageAnalysis.imagesWithoutAlt > 0) {
      issues.push('تصاویر فاقد Alt Text');
      suggestions.push('Alt Text برای همه تصاویر اضافه کنید');
    }

    // بررسی کلمات کلیدی
    if (analysis.keywordAnalysis.overusedKeywords.length > 0) {
      issues.push('استفاده بیش از حد از کلمات کلیدی');
      suggestions.push('تراکم کلمات کلیدی را کاهش دهید');
    }

    if (analysis.keywordAnalysis.missingKeywords.length > 0) {
      issues.push('کلمات کلیدی هدف کمتر استفاده شده');
      suggestions.push('کلمات کلیدی را بیشتر در محتوا بگنجانید');
    }

    // بررسی خوانایی
    if (analysis.readabilityMetrics.fleschReadingEase < 30) {
      issues.push('محتوا سخت خوانده می‌شود');
      suggestions.push('جملات کوتاه‌تر و ساده‌تر بنویسید');
    }

    // بررسی duplicate content
    if (analysis.duplicateAnalysis.isDuplicate) {
      issues.push('محتوای تکراری شناسایی شد');
      suggestions.push('محتوای منحصر به فرد ایجاد کنید');
    }

    return { issues, suggestions };
  }

  /**
   * محاسبه امتیاز کیفیت محتوا
   */
  calculateContentQuality(analysis: ContentAnalysisResult): ContentQualityMetrics {
    // امتیاز اصالت محتوا
    const originalityScore = analysis.uniquenessScore;
    
    // امتیاز مرتبط بودن
    const relevanceScore = analysis.semanticAnalysis.topicRelevance;
    
    // امتیاز جذابیت (بر اساس خوانایی و ساختار)
    const engagementScore = Math.min(100, 
      (analysis.readabilityScore + 
       (analysis.headingStructure.hasProperHierarchy ? 50 : 0) + 
       (analysis.imageAnalysis.totalImages > 0 ? 25 : 0)) / 1.75
    );
    
    // امتیاز تکنیکی
    const technicalScore = Math.min(100,
      ((analysis.imageAnalysis.totalImages - analysis.imageAnalysis.imagesWithoutAlt) / 
       Math.max(1, analysis.imageAnalysis.totalImages)) * 50 +
      (analysis.internalLinkingScore + analysis.externalLinkingScore) / 4
    );
    
    // امتیاز کلی
    const overallScore = (originalityScore + relevanceScore + engagementScore + technicalScore) / 4;

    return {
      originalityScore,
      relevanceScore, 
      engagementScore,
      technicalScore,
      overallScore
    };
  }
}

export const contentOptimizer = new ContentOptimizer();