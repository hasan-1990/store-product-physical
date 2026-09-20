import { useState, useEffect } from 'react';

interface ModuleConfig {
  enabled: boolean;
  name: string;
  href: string;
}

interface ModuleSettings {
  [key: string]: ModuleConfig;
}

export const useModules = () => {
  const [modules, setModules] = useState<ModuleSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/modules');
      const data = await response.json();
      
      if (data.success) {
        setModules(data.modules);
      } else {
        setError(data.error || 'Failed to fetch modules');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleKey: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
          moduleKey,
          enabled
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setModules(prev => ({
          ...prev,
          [moduleKey]: {
            ...prev[moduleKey],
            enabled
          }
        }));
        return true;
      } else {
        setError(data.error || 'Failed to update module');
        return false;
      }
    } catch (err) {
      setError('Network error');
      console.error('Error toggling module:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  return {
    modules,
    loading,
    error,
    toggleModule,
    refetch: fetchModules
  };
};