import { useState, useEffect } from 'react';

interface HomepageContentData {
  introSection: {
    title: string;
    content: string;
    showButtons: boolean;
    active: boolean;
  };
  servicesSection: {
    title: string;
    subtitle: string;
    services: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
    showStats: boolean;
    active: boolean;
  };
  faqSection: {
    title: string;
    subtitle: string;
    faqs: Array<{
      question: string;
      answer: string;
    }>;
    active: boolean;
  };
}

export function useHomepageContent() {
  const [content, setContent] = useState<HomepageContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/homepage-content');
      const data = await response.json();
      
      if (data.success) {
        setContent(data.data);
        setError(null);
      } else {
        setError(data.error || 'خطا در دریافت محتوا');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
      console.error('Error fetching homepage content:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (newContent: HomepageContentData) => {
    try {
      const response = await fetch('/api/admin/homepage-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContent),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContent(data.data);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error updating homepage content:', err);
      return { success: false, error: 'خطا در ارتباط با سرور' };
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    error,
    updateContent,
    refetch: fetchContent
  };
}