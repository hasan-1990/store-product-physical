'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DynamicContent, SiteContent } from '@/types';

interface DynamicContentContextType {
  content: Record<string, string>;
  getContent: (key: string, defaultValue?: string) => string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DynamicContentContext = createContext<DynamicContentContextType | undefined>(undefined);

export function DynamicContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/dynamic-content');
      const result = await response.json();
      
      if (result.success && result.map) {
        setContent(result.map);
      }
    } catch (error) {
      console.error('خطا در دریافت محتوای داینامیک:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const getContent = (key: string, defaultValue: string = '') => {
    return content[key] || defaultValue;
  };

  const refresh = async () => {
    setLoading(true);
    await fetchContent();
  };

  return (
    <DynamicContentContext.Provider value={{ content, getContent, loading, refresh }}>
      {children}
    </DynamicContentContext.Provider>
  );
}

export function useDynamicContent() {
  const context = useContext(DynamicContentContext);
  if (context === undefined) {
    throw new Error('useDynamicContent must be used within DynamicContentProvider');
  }
  return context;
}
