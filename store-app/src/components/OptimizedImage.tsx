"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image, { ImageProps } from "next/image";

const PLACEHOLDER = "/images/products/placeholder.svg";

/**
 * Unified image component enforcing SEO and performance best practices.
 *
 * Features:
 * - Requires alt (fallbacks to provided descriptive fallback when empty)
 * - Lazy loads by default; priority images must explicitly set `priority`
 * - Adds decoding="async" and fetchPriority mapping
 * - Optionally inlines a preload tag (call site responsibility via higher-level component/page)
 * - Provides future hook for AVIF/WebP <picture> wrapper (Next.js already serves optimized formats)
 * - Auto applies `loading="lazy"` unless priority
 * - Accepts `aspectRatio` to reserve space and prevent CLS
 * - Auto converts .jpg/.jpeg in /uploads/ to .webp for better performance
 */
export interface OptimizedImageProps extends Omit<ImageProps, "alt"> {
  alt: string; // force alt
  aspectRatio?: number; // width / height ratio to preserve layout if width/height dynamic
  preload?: boolean; // intention marker (actual <link> tag injected at page level)
  fetchPriority?: "high" | "low" | "auto"; // allow override
  decoding?: "async" | "sync" | "auto";
  unoptimized?: boolean; // allow disabling optimization for data URIs
  enhancedAlt?: string; // optional: additional context for better SEO
}

const DEFAULT_ALT_FALLBACK = "تصویر محصول";

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  alt,
  priority = false,
  loading,
  aspectRatio,
  className,
  style,
  decoding = "async",
  fetchPriority,
  unoptimized,
  src,
  enhancedAlt,
  ...imageProps
}) => {
  // Ensure alt never empty; SEO requires descriptive alt where possible.
  // If enhancedAlt provided, use it for better SEO context
  const baseAlt = alt?.trim() || DEFAULT_ALT_FALLBACK;
  const finalAlt = enhancedAlt ? `${baseAlt} - ${enhancedAlt}` : baseAlt;

  const finalLoading = priority ? undefined : (loading || "lazy");
  const finalFetchPriority = fetchPriority || (priority ? "high" : undefined);

  const combinedStyle = useMemo(() => {
    if (!aspectRatio) return style;
    return { ...(style || {}), aspectRatio: `${aspectRatio}` } as React.CSSProperties;
  }, [style, aspectRatio]);

  const normalizedSrc = useMemo<OptimizedImageProps["src"]>(() => {
    if (typeof src !== "string") return src;
    if (!src) return src;

    const [pathPart, queryPart] = src.split("?", 2);
    const hasUploadsSegment = pathPart.includes("/uploads/");
    const isJpeg = /\.jpe?g$/i.test(pathPart);

    if (hasUploadsSegment && isJpeg) {
      const transformedPath = pathPart.replace(/\.jpe?g$/i, ".webp");
      return queryPart ? `${transformedPath}?${queryPart}` : transformedPath;
    }

    return src;
  }, [src]);

  const isLocalUpload = useMemo(() => {
    if (typeof normalizedSrc !== "string") return false;
    return normalizedSrc.startsWith("/uploads/");
  }, [normalizedSrc]);

  const [imgSrc, setImgSrc] = useState<OptimizedImageProps["src"]>(normalizedSrc);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImgSrc(normalizedSrc);
    setImageFailed(false);
  }, [normalizedSrc]);

  return (
    <Image
      alt={finalAlt}
      priority={priority}
      loading={finalLoading as any}
      {...(finalFetchPriority ? { fetchPriority: finalFetchPriority } : {})}
      decoding={decoding as any}
      className={className}
      style={combinedStyle}
      unoptimized={unoptimized || imageFailed || isLocalUpload}
      src={imageFailed ? PLACEHOLDER : imgSrc}
      onError={() => {
        if (!imageFailed) {
          setImageFailed(true);
          setImgSrc(PLACEHOLDER);
        }
      }}
      {...imageProps}
    />
  );
};

export default OptimizedImage;
