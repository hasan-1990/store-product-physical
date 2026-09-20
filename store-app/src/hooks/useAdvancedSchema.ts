import { useState, useCallback } from 'react';

interface SchemaData {
  [key: string]: any;
}

interface GeneratedSchema {
  success: boolean;
  schema?: any;
  jsonLD?: string;
  error?: string;
  details?: string;
}

interface AvailableSchema {
  type: string;
  name: string;
  description: string;
  required: string[];
  optional: string[];
  example?: any;
}

export const useAdvancedSchema = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSchema, setGeneratedSchema] = useState<any>(null);
  const [jsonLD, setJsonLD] = useState<string | null>(null);
  const [availableSchemas, setAvailableSchemas] = useState<AvailableSchema[]>([]);

  // دریافت لیست Schema های موجود
  const getAvailableSchemas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/seo/schema');
      const result = await response.json();

      if (result.success) {
        setAvailableSchemas(result.schemas);
        return result.schemas;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت Schema ها';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // تولید Schema
  const generateSchema = useCallback(async (
    schemaType: string, 
    data?: SchemaData
  ): Promise<GeneratedSchema> => {
    try {
      setLoading(true);
      setError(null);
      setGeneratedSchema(null);
      setJsonLD(null);

      const response = await fetch('/api/admin/seo/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemaType,
          data
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedSchema(result.schema);
        setJsonLD(result.jsonLD);
        return result;
      } else {
        throw new Error(result.error || result.details);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در تولید Schema';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // تولید Schema های مختلف
  const generateWebSiteSchema = useCallback(() => {
    return generateSchema('website');
  }, [generateSchema]);

  const generateOrganizationSchema = useCallback(() => {
    return generateSchema('organization');
  }, [generateSchema]);

  const generateLocalBusinessSchema = useCallback((
    businessType?: string,
    coordinates?: { latitude: number; longitude: number },
    openingHours?: string[],
    priceRange?: string
  ) => {
    return generateSchema('localbusiness', {
      businessType,
      coordinates,
      openingHours,
      priceRange
    });
  }, [generateSchema]);

  const generateFAQSchema = useCallback((faqs: Array<{ question: string; answer: string }>) => {
    return generateSchema('faq', { faqs });
  }, [generateSchema]);

  const generateBreadcrumbSchema = useCallback((breadcrumbs: Array<{ name: string; url?: string }>) => {
    return generateSchema('breadcrumb', { breadcrumbs });
  }, [generateSchema]);

  const generateEventSchema = useCallback((
    name: string,
    description: string,
    startDate: string,
    endDate?: string,
    location?: string,
    organizer?: string,
    offers?: Array<{ price: string; currency: string }>
  ) => {
    return generateSchema('event', {
      name,
      description,
      startDate,
      endDate,
      location,
      organizer,
      offers
    });
  }, [generateSchema]);

  const generateReviewSchema = useCallback((
    reviewText: string,
    rating: number,
    authorName: string,
    itemName: string,
    itemUrl?: string,
    datePublished?: string
  ) => {
    return generateSchema('review', {
      reviewText,
      rating,
      authorName,
      itemName,
      itemUrl,
      datePublished
    });
  }, [generateSchema]);

  // کپی JSON-LD
  const copyJsonLD = useCallback(() => {
    if (jsonLD) {
      navigator.clipboard.writeText(jsonLD);
    }
  }, [jsonLD]);

  // پاک کردن داده‌ها
  const clearData = useCallback(() => {
    setGeneratedSchema(null);
    setJsonLD(null);
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    generatedSchema,
    jsonLD,
    availableSchemas,

    // Methods
    getAvailableSchemas,
    generateSchema,
    
    // Specific generators
    generateWebSiteSchema,
    generateOrganizationSchema,
    generateLocalBusinessSchema,
    generateFAQSchema,
    generateBreadcrumbSchema,
    generateEventSchema,
    generateReviewSchema,

    // Utilities
    copyJsonLD,
    clearData
  };
};