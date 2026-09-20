'use client';
import React from 'react';

interface HiddenSEOContentProps {
  children: React.ReactNode;
  method?: 'screenreader' | 'position' | 'opacity' | 'text-indent';
  className?: string;
}

/**
 * کامپوننت محتوای مخفی برای سئو
 * این محتوا فقط برای موتورهای جستجو قابل مشاهده است
 */
export default function HiddenSEOContent({ 
  children, 
  method = 'screenreader',
  className = '' 
}: HiddenSEOContentProps) {
  
  // فقط از CSS class استفاده می‌کنیم - بدون inline styles که ممکن است overflow ایجاد کنند
  return (
    <div 
      className={`seo-hidden-content ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      {children}
    </div>
  );
}

/**
 * کامپوننت ساده‌تر برای متن مخفی
 */
export function HiddenSEOText({ 
  text, 
  method = 'screenreader' 
}: { 
  text: string; 
  method?: 'screenreader' | 'position' | 'opacity' | 'text-indent';
}) {
  return (
    <HiddenSEOContent method={method}>
      <span>{text}</span>
    </HiddenSEOContent>
  );
}

/**
 * کامپوننت لیست کلمات کلیدی مخفی
 */
export function HiddenKeywords({ 
  keywords, 
  method = 'screenreader' 
}: { 
  keywords: string[]; 
  method?: 'screenreader' | 'position' | 'opacity' | 'text-indent';
}) {
  return (
    <HiddenSEOContent method={method}>
      <div className="hidden-keywords">
        {keywords.map((keyword, index) => (
          <span key={index}>
            {keyword}
            {index < keywords.length - 1 && ', '}
          </span>
        ))}
      </div>
    </HiddenSEOContent>
  );
}

/**
 * کامپوننت توضیحات تکمیلی مخفی
 */
export function HiddenDescription({ 
  description, 
  method = 'screenreader' 
}: { 
  description: string; 
  method?: 'screenreader' | 'position' | 'opacity' | 'text-indent';
}) {
  return (
    <HiddenSEOContent method={method}>
      <p className="hidden-description">
        {description}
      </p>
    </HiddenSEOContent>
  );
}

/**
 * کامپوننت محتوای ساختارمند مخفی
 */
export function HiddenStructuredContent({ 
  title,
  description,
  keywords,
  categories,
  features,
  method = 'screenreader' 
}: { 
  title?: string;
  description?: string;
  keywords?: string[];
  categories?: string[];
  features?: string[];
  method?: 'screenreader' | 'position' | 'opacity' | 'text-indent';
}) {
  return (
    <HiddenSEOContent method={method}>
      <div className="hidden-structured-content">
        {title && (
          <h2 className="hidden-title">{title}</h2>
        )}
        
        {description && (
          <p className="hidden-description">{description}</p>
        )}
        
        {keywords && keywords.length > 0 && (
          <div className="hidden-keywords">
            <span>کلمات کلیدی: </span>
            {keywords.join(', ')}
          </div>
        )}
        
        {categories && categories.length > 0 && (
          <div className="hidden-categories">
            <span>دسته‌بندی‌ها: </span>
            {categories.join(', ')}
          </div>
        )}
        
        {features && features.length > 0 && (
          <div className="hidden-features">
            <span>ویژگی‌ها: </span>
            {features.join(', ')}
          </div>
        )}
      </div>
    </HiddenSEOContent>
  );
}