'use client';
import React, { useState, useEffect } from 'react';
import { SEOSettings, SEOAnalysis } from '@/types/seo';

interface SEOAnalyzerProps {
  content: string;
  settings: SEOSettings;
  onAnalysisComplete?: (analysis: SEOAnalysis) => void;
}

export default function SEOAnalyzer({ content, settings, onAnalysisComplete }: SEOAnalyzerProps) {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeContent = () => {
    setIsAnalyzing(true);
    
    // آنالیز عنوان
    const titleAnalysis = {
      text: settings.title,
      length: settings.title.length,
      isOptimal: settings.title.length >= 30 && settings.title.length <= 60,
      suggestions: [] as string[]
    };
    
    if (settings.title.length < 30) {
      titleAnalysis.suggestions.push('عنوان کوتاه است. حداقل 30 کاراکتر توصیه می‌شود.');
    }
    if (settings.title.length > 60) {
      titleAnalysis.suggestions.push('عنوان طولانی است. حداکثر 60 کاراکتر توصیه می‌شود.');
    }

    // آنالیز توضیحات
    const descriptionAnalysis = {
      text: settings.description,
      length: settings.description.length,
      isOptimal: settings.description.length >= 120 && settings.description.length <= 160,
      suggestions: [] as string[]
    };
    
    if (settings.description.length < 120) {
      descriptionAnalysis.suggestions.push('توضیحات کوتاه است. حداقل 120 کاراکتر توصیه می‌شود.');
    }
    if (settings.description.length > 160) {
      descriptionAnalysis.suggestions.push('توضیحات طولانی است. حداکثر 160 کاراکتر توصیه می‌شود.');
    }

    // آنالیز کلمات کلیدی
    const keywordDensity = analyzeKeywordDensity(content, settings.keywords || []);
    const keywordsAnalysis = {
      primary: settings.keywords?.[0],
      density: keywordDensity,
      suggestions: [] as string[]
    };

    // آنالیز headings
    const headingMatches = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    const h1Matches = content.match(/<h1[^>]*>.*?<\/h1>/gi) || [];
    const h2Matches = content.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
    
    const headingsAnalysis = {
      h1Count: h1Matches.length,
      h2Count: h2Matches.length,
      structure: headingMatches.map(h => h.replace(/<[^>]*>/g, '')),
      issues: [] as string[]
    };
    
    if (h1Matches.length === 0) {
      headingsAnalysis.issues.push('هیچ H1 یافت نشد. باید حداقل یک H1 داشته باشید.');
    }
    if (h1Matches.length > 1) {
      headingsAnalysis.issues.push('بیش از یک H1 یافت شد. فقط یک H1 توصیه می‌شود.');
    }

    // آنالیز تصاویر
    const imageMatches = content.match(/<img[^>]*>/gi) || [];
    const imagesWithAlt = content.match(/<img[^>]*alt=["'][^"']*["'][^>]*>/gi) || [];
    
    const imagesAnalysis = {
      total: imageMatches.length,
      withAlt: imagesWithAlt.length,
      withoutAlt: imageMatches.length - imagesWithAlt.length,
      suggestions: [] as string[]
    };
    
    if (imagesAnalysis.withoutAlt > 0) {
      imagesAnalysis.suggestions.push(`${imagesAnalysis.withoutAlt} تصویر بدون alt text یافت شد.`);
    }

    // آنالیز لینک‌ها
    const linkMatches = content.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [];
    const internalLinks = linkMatches.filter(link => 
      link.includes(settings.siteUrl || '') || 
      !link.includes('http')
    );
    const externalLinks = linkMatches.filter(link => 
      link.includes('http') && 
      !link.includes(settings.siteUrl || '')
    );
    
    const linksAnalysis = {
      internal: internalLinks.length,
      external: externalLinks.length,
      broken: [] // باید بررسی واقعی شود
    };

    // محاسبه امتیاز کلی
    let score = 0;
    if (titleAnalysis.isOptimal) score += 20;
    if (descriptionAnalysis.isOptimal) score += 20;
    if (headingsAnalysis.h1Count === 1) score += 15;
    if (headingsAnalysis.h2Count > 0) score += 10;
    if (imagesAnalysis.withoutAlt === 0 && imagesAnalysis.total > 0) score += 15;
    if (keywordsAnalysis.density.length > 0) score += 10;
    if (linksAnalysis.internal > 0) score += 10;

    const analysisResult: SEOAnalysis = {
      pageUrl: settings.canonicalUrl || '',
      title: titleAnalysis,
      description: descriptionAnalysis,
      keywords: keywordsAnalysis,
      headings: headingsAnalysis,
      images: imagesAnalysis,
      links: linksAnalysis,
      performance: {
        loadTime: 0, // باید از Performance API استفاده شود
        coreWebVitals: {
          lcp: 0,
          fid: 0,
          cls: 0
        }
      },
      overallScore: score,
      suggestions: [
        ...titleAnalysis.suggestions,
        ...descriptionAnalysis.suggestions,
        ...headingsAnalysis.issues,
        ...imagesAnalysis.suggestions
      ]
    };

    setAnalysis(analysisResult);
    setIsAnalyzing(false);
    
    if (onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
    }
  };

  const analyzeKeywordDensity = (text: string, keywords: string[]) => {
    const cleanText = text.replace(/<[^>]*>/g, '').toLowerCase();
    const words = cleanText.split(/\s+/);
    const totalWords = words.length;
    
    return keywords.map(keyword => {
      const count = (cleanText.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
      
      return {
        word: keyword,
        count,
        density: parseFloat(density.toFixed(2))
      };
    });
  };

  useEffect(() => {
    if (content && settings.title) {
      analyzeContent();
    }
  }, [content, settings]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'عالی';
    if (score >= 60) return 'خوب';
    if (score >= 40) return 'متوسط';
    return 'ضعیف';
  };

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="mr-3 text-gray-300">در حال آنالیز...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center p-8">
        <button
          onClick={analyzeContent}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          شروع آنالیز SEO
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* امتیاز کلی */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">امتیاز کلی SEO</h3>
          <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
            {analysis.overallScore}/100
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              analysis.overallScore >= 80 ? 'bg-green-500' :
              analysis.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${analysis.overallScore}%` }}
          />
        </div>
        <p className={`mt-2 text-sm ${getScoreColor(analysis.overallScore)}`}>
          {getScoreLabel(analysis.overallScore)}
        </p>
      </div>

      {/* جزئیات آنالیز */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* عنوان */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">عنوان صفحه</h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">طول:</span>
            <span className={analysis.title.isOptimal ? 'text-green-500' : 'text-red-500'}>
              {analysis.title.length} کاراکتر
            </span>
          </div>
          {analysis.title.suggestions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {analysis.title.suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-yellow-400">• {suggestion}</li>
              ))}
            </ul>
          )}
        </div>

        {/* توضیحات */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">توضیحات</h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">طول:</span>
            <span className={analysis.description.isOptimal ? 'text-green-500' : 'text-red-500'}>
              {analysis.description.length} کاراکتر
            </span>
          </div>
          {analysis.description.suggestions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {analysis.description.suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-yellow-400">• {suggestion}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Headings */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">ساختار عناوین</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">H1:</span>
              <span className={analysis.headings.h1Count === 1 ? 'text-green-500' : 'text-red-500'}>
                {analysis.headings.h1Count}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">H2:</span>
              <span className="text-blue-400">{analysis.headings.h2Count}</span>
            </div>
          </div>
          {analysis.headings.issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {analysis.headings.issues.map((issue, index) => (
                <li key={index} className="text-xs text-red-400">• {issue}</li>
              ))}
            </ul>
          )}
        </div>

        {/* تصاویر */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">تصاویر</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">کل:</span>
              <span className="text-blue-400">{analysis.images.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">با Alt:</span>
              <span className="text-green-500">{analysis.images.withAlt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">بدون Alt:</span>
              <span className={analysis.images.withoutAlt > 0 ? 'text-red-500' : 'text-green-500'}>
                {analysis.images.withoutAlt}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* پیشنهادات */}
      {analysis.suggestions.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">پیشنهادات بهبود</h3>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start text-sm text-gray-300">
                <span className="text-yellow-500 mr-2">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* کلمات کلیدی */}
      {analysis.keywords.density.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">چگالی کلمات کلیدی</h3>
          <div className="space-y-3">
            {analysis.keywords.density.map((keyword, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-300">{keyword.word}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">{keyword.count} بار</span>
                  <span className={`text-sm ${
                    keyword.density >= 1 && keyword.density <= 3 ? 'text-green-500' :
                    keyword.density > 3 ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {keyword.density}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}