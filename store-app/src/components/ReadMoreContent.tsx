"use client";

import { useMemo, useState } from 'react';

interface ReadMoreContentProps {
  content: string;
  className?: string;
  readMoreText?: string;
  readLessText?: string;
  maxLength?: number;

  // When enabled, the toggle is rendered as an overlay on the teaser image
  // instead of a separate button under the content.
  useImageOverlayToggle?: boolean;
  teaserHeight?: number;
}

export default function ReadMoreContent({
  content,
  className = '',
  readMoreText = 'مشاهده بیشتر',
  readLessText = 'مشاهده کمتر',
  maxLength = 300,
  useImageOverlayToggle = false,
  teaserHeight = 400
}: ReadMoreContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parsed = useMemo(() => {
    const textSeparator = '[read-more]';
    // IMPORTANT: don't use /g with .test() (it mutates lastIndex and becomes unreliable)
    const htmlSeparatorReplaceRegex = /<[^>]*data-read-more-separator[^>]*>.*?<\/[^>]*>/gi;
    const htmlSeparatorTestRegex = /<[^>]*data-read-more-separator[^>]*>.*?<\/[^>]*>/i;

    const normalized = (() => {
      if (!content) return '';
      if (htmlSeparatorTestRegex.test(content)) {
        return content.replace(htmlSeparatorReplaceRegex, textSeparator);
      }
      return content;
    })();

    const hasSeparator = normalized.includes(textSeparator);

    const fullHtml = normalized.replace(textSeparator, '');

    const collapsedRawHtml = (() => {
      if (hasSeparator) return normalized.split(textSeparator)[0];
      if (normalized.length > maxLength) return normalized.substring(0, maxLength) + '...';
      return normalized;
    })();

    const shouldShowToggle = hasSeparator || normalized.length > maxLength;

    // In SSR (or any non-browser context), don't attempt DOM parsing.
    if (typeof window === 'undefined') {
      return {
        hasSeparator,
        shouldShowToggle,
        fullHtml,
        collapsedTextHtml: collapsedRawHtml,
        teaser: null as null | { src: string; alt: string },
      };
    }

    const parser = new DOMParser();

    // Extract teaser image from full content
    const fullDoc = parser.parseFromString(fullHtml, 'text/html');
    const teaserImgEl = fullDoc.querySelector('img[data-has-read-more="true"]') as HTMLImageElement | null;
    const teaser = teaserImgEl?.getAttribute('src')
      ? { src: teaserImgEl.getAttribute('src') || '', alt: teaserImgEl.getAttribute('alt') || '' }
      : null;

    // Remove teaser image from collapsed text (so it won't be clipped by line-clamp)
    const teaserTextDoc = parser.parseFromString(collapsedRawHtml, 'text/html');
    const teaserInCollapsed = teaserTextDoc.querySelector('img[data-has-read-more="true"]');
    if (teaserInCollapsed) teaserInCollapsed.remove();
    const collapsedTextHtml = teaserTextDoc.body.innerHTML;

    return {
      hasSeparator,
      shouldShowToggle,
      fullHtml,
      collapsedTextHtml,
      teaser,
    };
  }, [content, maxLength]);

  const displayHtml = isExpanded ? parsed.fullHtml : parsed.collapsedTextHtml;

  // If using image-overlay mode and we have a teaser image, don't render the external "مشاهده بیشتر" button.
  const showExternalToggle = parsed.shouldShowToggle && (!useImageOverlayToggle || !parsed.teaser || isExpanded);

  return (
    <div className={className} data-expanded={isExpanded ? 'true' : 'false'}>
      {/* متن */}
      <div
        className={`space-y-3 ${isExpanded ? '[&_img]:!h-auto [&_img]:!object-contain' : ''}`}
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />

      {/* تیزر عکس + دکمه روی عکس (مثل ادیتور) */}
      {useImageOverlayToggle && !isExpanded && parsed.teaser?.src && parsed.shouldShowToggle && (
        <div
          className="relative w-full overflow-hidden rounded-lg my-6"
          style={{ height: `${teaserHeight}px` }}
        >
          <img
            src={parsed.teaser.src}
            alt={parsed.teaser.alt}
            style={{
              width: '100%',
              height: `${teaserHeight}px`,
              objectFit: 'cover',
              objectPosition: '50% 0%',
              display: 'block',
            }}
          />
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="absolute left-1/2 bottom-4 -translate-x-1/2 inline-flex items-center gap-2 text-white font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-3 rounded-lg shadow-lg shadow-purple-500/50 border border-purple-400/50"
          >
            <span>{readMoreText}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
      
      {/* دکمه مشاهده بیشتر */}
      {showExternalToggle && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 text-white font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-3 rounded-lg shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 border border-purple-400/50 hover:border-purple-300"
            type="button"
          >
            <span>{isExpanded ? readLessText : readMoreText}</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
